import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import { prisma } from "../db";
import { BS_MONTH_NAMES_NP, getBsDateParts } from "../utils/dateFormatters";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require("pdfkit");

/**
 * Fonts (same as pdfController.ts)
 */
function fontPath(rel: string) {
  return path.join(__dirname, "..", "assets", "fonts", rel);
}
const FONT_LATIN_REGULAR = fontPath("NotoSans-Regular.ttf");
const FONT_DEVANAGARI_REGULAR = fontPath("NotoSansDevanagari-Regular.ttf");
const FONT_DEVANAGARI_BOLD = fontPath("NotoSansDevanagari-Bold.ttf");
const FONT_EMOJI_REGULAR = fontPath("NotoEmoji-Regular.ttf");

function ensureFontExists(p: string) {
  if (!fs.existsSync(p)) throw new Error(`Font file missing: ${p}`);
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

type TextRunType = "latin" | "devanagari" | "emoji";

function resolveRunType(char: string): TextRunType {
  if (EMOJI_REGEX.test(char)) return "emoji";
  if (DEVANAGARI_REGEX.test(char)) return "devanagari";
  return "latin";
}

function setFontForRun(doc: any, runType: TextRunType, style: "normal" | "bold" = "normal") {
  if (runType === "emoji" && fs.existsSync(FONT_EMOJI_REGULAR)) return doc.font(FONT_EMOJI_REGULAR);
  if (runType === "devanagari") return doc.font(style === "bold" ? FONT_DEVANAGARI_BOLD : FONT_DEVANAGARI_REGULAR);
  return doc.font(FONT_LATIN_REGULAR);
}

function writeTextWithFallback(
  doc: any,
  text: string,
  options: { continued?: boolean; align?: "left" | "center" | "right"; width?: number; x?: number; y?: number } = {},
  style: "normal" | "bold" = "normal",
) {
  const value = String(text ?? "");
  if (!value) return doc.text("", { continued: options.continued });

  const { x, y, ...textOptions } = options;

  const segments: Array<{ text: string; type: TextRunType }> = [];
  let currentType = resolveRunType(value[0]);
  let buffer = "";

  for (const char of value) {
    const type = resolveRunType(char);
    if (type !== currentType) {
      segments.push({ text: buffer, type: currentType });
      buffer = "";
      currentType = type;
    }
    buffer += char;
  }
  if (buffer) segments.push({ text: buffer, type: currentType });

  let first = true;
  for (const seg of segments) {
    setFontForRun(doc, seg.type, style);
    doc.text(seg.text, first ? x : undefined, first ? y : undefined, { ...textOptions, continued: true });
    first = false;
  }
  doc.text("", { continued: options.continued }); // end continued chain
  doc.font(FONT_LATIN_REGULAR);
}

function setPdfHeaders(res: Response, filename: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
}

function createDoc(res: Response, paper: string) {
  ensureFontExists(FONT_LATIN_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_BOLD);
  if (!fs.existsSync(FONT_EMOJI_REGULAR)) console.warn("Emoji font missing:", FONT_EMOJI_REGULAR);

  const size = paper.toUpperCase(); // "A4", "A3", ...
  const doc = new PDFDocument({ size, margin: 36 });
  doc.pipe(res);
  doc.font(FONT_LATIN_REGULAR);
  return doc;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * NepaliDateConverter (same vendor file you already have in backend/assets/vendor)
 */
const nepaliDateConverterPath = (() => {
  const distPath = path.join(__dirname, "..", "assets", "vendor", "nepali-date-converter.umd.js");
  if (fs.existsSync(distPath)) return distPath;
  return path.join(__dirname, "..", "..", "assets", "vendor", "nepali-date-converter.umd.js");
})();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NepaliDateConverter = require(nepaliDateConverterPath);
const NepaliDate = NepaliDateConverter?.default ?? NepaliDateConverter;

function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  // parse "YYYY-MM-DD" in BS and convert to JS date
  const d = NepaliDate.parse(`${bsYear}-${pad2(bsMonth)}-${pad2(bsDay)}`);
  return d.toJsDate();
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    if (!url) return null;
    const client = url.startsWith("https://") ? https : http;

    return await new Promise((resolve) => {
      client
        .get(url, (resp) => {
          const code = resp.statusCode ?? 0;
          if (code < 200 || code >= 300) return resolve(null);
          const chunks: Buffer[] = [];
          resp.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          resp.on("end", () => resolve(Buffer.concat(chunks)));
        })
        .on("error", () => resolve(null));
    });
  } catch {
    return null;
  }
}

type CalendarItem = { bsDay: number; title: string; type: string; time?: string };

async function loadMonthItems(bsYear: number, bsMonth: number): Promise<CalendarItem[]> {
  // NOTE: No `not: null` filters here — your Prisma types showed those fields are non-nullable.
  const [events, news, sermons, blogs, rosters, schedules] = await Promise.all([
    prisma.eventitem.findMany({ select: { date: true, title: true, time: true } }),
    prisma.newsitem.findMany({ select: { date: true, title: true } }),
    prisma.sermon.findMany({ select: { date: true, title: true } }),
    prisma.blogpost.findMany({ select: { date: true, title: true } }),
    prisma.fellowshiprosteritem.findMany({ select: { assignedDate: true, groupNameOrEventTitle: true, timeSlot: true } }),
    prisma.generatedscheduleitem.findMany({ select: { scheduledDate: true, groupNameOrEventTitle: true, timeSlot: true } }),
  ]);

  const out: CalendarItem[] = [];

  const add = (dateValue: Date | null, title: string, type: string, time?: string) => {
    if (!dateValue) return;
    const bs = getBsDateParts(dateValue);
    if (!bs) return;
    if (bs.year !== bsYear || bs.month !== bsMonth) return;
    out.push({ bsDay: bs.day, title: String(title || "").trim() || type, type, time });
  };

  events.forEach((e) => add(e.date ?? null, e.title ?? "Event", "Event", e.time ?? undefined));
  news.forEach((n) => add(n.date ?? null, n.title ?? "News", "News"));
  sermons.forEach((s) => add(s.date ?? null, s.title ?? "Sermon", "Sermon"));
  blogs.forEach((b) => add(b.date ?? null, b.title ?? "Blog", "Blog"));
  rosters.forEach((r) => add(r.assignedDate ?? null, r.groupNameOrEventTitle ?? "Notice", "Notice", r.timeSlot ?? undefined));
  schedules.forEach((g) => add(g.scheduledDate ?? null, g.groupNameOrEventTitle ?? "Notice", "Notice", g.timeSlot ?? undefined));

  return out.sort((a, b) => a.bsDay - b.bsDay);
}

function drawHeader(doc: any, x: number, y: number, w: number) {
  doc.save();
  doc.rect(x, y, w, 52).fill("#f1f5f9");
  doc.fillColor("#0f172a");
  doc.fontSize(18);
  writeTextWithFallback(doc, "Bishram Ekata Mandali", { x: x + 12, y: y + 10, width: w - 24 }, "bold");
  doc.fontSize(9);
  writeTextWithFallback(
    doc,
    "Gauri Marg, Sinamangal, Kathmandu | www.bekatam.org",
    { x: x + 12, y: y + 34, width: w - 24 },
    "normal",
  );
  doc.restore();
}

function drawFooter(doc: any, x: number, y: number, w: number) {
  doc.save();
  doc.strokeColor("#e2e8f0").lineWidth(1);
  doc.moveTo(x, y).lineTo(x + w, y).stroke();
  doc.fillColor("#64748b").fontSize(8);
  doc.text(`Generated at: ${new Date().toLocaleString()}`, x, y + 6, { width: w, align: "left" });
  doc.restore();
}

function drawMonthPage(
  doc: any,
  opts: {
    bsYear: number;
    bsMonth: number;
    paper: string;
    heroImage?: Buffer | null;
    monthItems: CalendarItem[];
  },
) {
  const { bsYear, bsMonth, heroImage, monthItems } = opts;

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const m = doc.page.margins;
  const x = m.left;
  const y = m.top;
  const w = pageW - m.left - m.right;

  // Header
  drawHeader(doc, x, y, w);

  // Month title bar
  const titleY = y + 60;
  doc.save();
  doc.rect(x, titleY, w, 28).fill("#0ea5e9");
  doc.fillColor("#ffffff").fontSize(14);
  writeTextWithFallback(doc, `${BS_MONTH_NAMES_NP[bsMonth - 1]} ${bsYear} (BS)`, { x: x + 12, y: titleY + 7, width: w - 24 }, "bold");
  doc.restore();

  // Image area
  const imgY = titleY + 36;
  const imgH = Math.max(140, Math.min(190, pageH * 0.22));
  if (heroImage) {
    try {
      doc.image(heroImage, x, imgY, { fit: [w, imgH], align: "center", valign: "center" });
    } catch {
      // ignore bad image
    }
  } else {
    doc.save();
    doc.rect(x, imgY, w, imgH).fill("#f8fafc");
    doc.fillColor("#94a3b8").fontSize(10).text("No image", x, imgY + imgH / 2 - 6, { width: w, align: "center" });
    doc.restore();
  }

  // Calendar + sidebar layout
  const contentTop = imgY + imgH + 14;
  const footerH = 22;
  const contentBottom = pageH - m.bottom - footerH - 6;
  const contentH = contentBottom - contentTop;

  const gap = 12;
  const sidebarW = Math.max(160, w * 0.30);
  const gridW = w - sidebarW - gap;

  const gridX = x;
  const gridY = contentTop;
  const sidebarX = x + gridW + gap;
  const sidebarY = contentTop;

  // Grid setup: 7 columns, 6 rows
  const cols = 7;
  const rows = 6;
  const cellW = gridW / cols;
  const cellH = contentH / rows;

  // Day names row (inside first row top strip)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Compute which weekday BS-01 lands on (via AD date)
  const adStart = bsToAd(bsYear, bsMonth, 1);
  const startWeekday = adStart.getDay(); // 0=Sun

  // Build day map for month length by trying BS days until it throws
  const dayAd: Array<{ bsDay: number; ad: Date }> = [];
  for (let d = 1; d <= 40; d += 1) {
    try {
      const ad = bsToAd(bsYear, bsMonth, d);
      const bs = getBsDateParts(ad);
      if (!bs || bs.year !== bsYear || bs.month !== bsMonth || bs.day !== d) break;
      dayAd.push({ bsDay: d, ad });
    } catch {
      break;
    }
  }

  const itemsByDay = new Map<number, CalendarItem[]>();
  monthItems.forEach((it) => {
    const list = itemsByDay.get(it.bsDay) ?? [];
    list.push(it);
    itemsByDay.set(it.bsDay, list);
  });

  // Draw grid cells
  doc.save();
  doc.strokeColor("#cbd5e1").lineWidth(1);

  // Header row labels above grid
  doc.fillColor("#0f172a").fontSize(9);
  for (let c = 0; c < cols; c += 1) {
    doc.rect(gridX + c * cellW, gridY, cellW, 16).fillAndStroke("#f1f5f9", "#cbd5e1");
    doc.fillColor("#0f172a").text(dayNames[c], gridX + c * cellW, gridY + 4, { width: cellW, align: "center" });
  }

  // Cells below day-name strip
  const gridBodyY = gridY + 16;
  const bodyCellH = (contentH - 16) / rows;

  let dayIndex = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = gridX + c * cellW;
      const cy = gridBodyY + r * bodyCellH;

      doc.rect(cx, cy, cellW, bodyCellH).stroke();

      const slot = r * cols + c;
      const bsDay = slot - startWeekday + 1;

      if (bsDay >= 1 && bsDay <= dayAd.length) {
        const ad = dayAd[bsDay - 1].ad;
        const adDay = ad.getDate();

        // Highlight if has items
        const hasItems = (itemsByDay.get(bsDay) ?? []).length > 0;
        if (hasItems) {
          doc.save();
          doc.rect(cx + 1, cy + 1, cellW - 2, bodyCellH - 2).fillOpacity(0.10).fill("#0ea5e9").fillOpacity(1);
          doc.restore();
        }

        // BS day (big)
        doc.fillColor("#0f172a").fontSize(16);
        writeTextWithFallback(doc, String(bsDay), { x: cx + 6, y: cy + 6, width: cellW - 12 }, "bold");

        // AD day (small top-right)
        doc.fillColor("#475569").fontSize(8);
        doc.text(String(adDay), cx, cy + 8, { width: cellW - 6, align: "right" });

        // Mini markers (optional)
        const markers = itemsByDay.get(bsDay) ?? [];
        if (markers.length) {
          doc.fillColor("#0f172a").fontSize(7);
          const short = markers.slice(0, 2).map((m) => (m.type === "Event" ? "E" : m.type === "Notice" ? "N" : "•")).join(" ");
          doc.text(short, cx + 6, cy + 28, { width: cellW - 12, align: "left" });
        }
      }
    }
  }

  doc.restore();

  // Sidebar (events list)
  doc.save();
  doc.rect(sidebarX, sidebarY, sidebarW, contentH).fillAndStroke("#ffffff", "#cbd5e1");
  doc.fillColor("#0f172a").fontSize(11);
  writeTextWithFallback(doc, "Events / Programs", { x: sidebarX + 10, y: sidebarY + 10, width: sidebarW - 20 }, "bold");

  doc.fillColor("#334155").fontSize(9);
  let ty = sidebarY + 32;

  const maxLines = Math.floor((contentH - 44) / 14);
  const lines: string[] = [];
  monthItems.forEach((it) => {
    const t = it.time ? ` @ ${it.time}` : "";
    lines.push(`${pad2(it.bsDay)} - ${it.title}${t}`);
  });

  if (!lines.length) lines.push("No scheduled programs for this month.");

  for (let i = 0; i < Math.min(lines.length, maxLines); i += 1) {
    doc.text(lines[i], sidebarX + 10, ty, { width: sidebarW - 20 });
    ty += 14;
  }

  doc.restore();

  // Footer
  drawFooter(doc, x, pageH - m.bottom - footerH, w);
}

export const getCalendarPdf = async (req: Request, res: Response) => {
  const bsYear = Number(String(req.query.bsYear || "").trim());
  const bsMonthRaw = String(req.query.bsMonth || "").trim();
  const bsMonth = bsMonthRaw ? Number(bsMonthRaw) : null;

  const paper = String(req.query.paperSize || "a4").toLowerCase();
  const allowed = new Set(["a4", "a3", "a2", "a1"]);
  const safePaper = allowed.has(paper) ? paper : "a4";

  if (!bsYear || Number.isNaN(bsYear)) return res.status(400).json({ message: "Missing bsYear" });
  if (bsMonth !== null && (Number.isNaN(bsMonth) || bsMonth < 1 || bsMonth > 12)) {
    return res.status(400).json({ message: "Invalid bsMonth (1-12)" });
  }

  try {
    // Pick a nice header image automatically:
    // - Use first active HomeSlide image (Cloudinary URL) if available.
    const slide = await prisma.homeslide.findFirst({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { imageUrl: true },
    });

    const heroImage = slide?.imageUrl ? await fetchImageBuffer(slide.imageUrl) : null;

    setPdfHeaders(res, bsMonth ? `BEM_Calendar_${bsYear}_${pad2(bsMonth)}_${safePaper}.pdf` : `BEM_Calendar_${bsYear}_${safePaper}.pdf`);
    const doc = createDoc(res, safePaper);

    const months = bsMonth ? [bsMonth] : [1,2,3,4,5,6,7,8,9,10,11,12];

    for (let i = 0; i < months.length; i += 1) {
      const m = months[i];
      const monthItems = await loadMonthItems(bsYear, m);

      if (i > 0) doc.addPage();
      drawMonthPage(doc, { bsYear, bsMonth: m, paper: safePaper, heroImage, monthItems });
    }

    doc.end();
  } catch (err) {
    console.error("calendarPdfController getCalendarPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate calendar PDF" });
    try { res.end(); } catch {}
  }
};
