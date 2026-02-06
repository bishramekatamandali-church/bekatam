// backend/src/controllers/calendarPdfController.ts
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
 * -----------------------
 * Fonts + Nepali fallback
 * -----------------------
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
  options: {
  continued?: boolean;
  align?: "left" | "center" | "right";
  width?: number;
  x?: number;
  y?: number;
  lineBreak?: boolean;
} = {},

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
  doc.text("", { continued: options.continued });
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

  const size = paper.toUpperCase(); // A4, A3...
  const doc = new PDFDocument({ size, margin: 24 }); // smaller margins to "full cover" paper
  doc.pipe(res);
  doc.font(FONT_LATIN_REGULAR);
  return doc;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function adMonthShort(date: Date) {
  return date.toLocaleString("en-US", { month: "short" }).toUpperCase();
}

function cleanNoticeTitle(input: string) {
  return String(input || "")
    .replace(/[\r\n]+/g, " ")     // remove line breaks
    .replace(/\s+/g, " ")         // collapse multiple spaces/tabs
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width chars
    .trim();
}

function drawNoticeTitleSingleLine(doc: any, title: string, x: number, y: number, width: number) {
  const t = cleanNoticeTitle(title || "");
  // Use devanagari font if any devanagari chars exist, otherwise latin
  const hasDev = DEVANAGARI_REGEX.test(t);
  doc.font(hasDev ? FONT_DEVANAGARI_REGULAR : FONT_LATIN_REGULAR);
  doc.text(t, x, y, {
    width,
    lineBreak: false,
    ellipsis: true, // truncate if too long
  });
  doc.font(FONT_LATIN_REGULAR); // restore
}

/**
 * -----------------------
 * BS <-> AD conversion
 * -----------------------
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
  const d = NepaliDate.parse(`${bsYear}-${pad2(bsMonth)}-${pad2(bsDay)}`);
  return d.toJsDate();
}

/**
 * -----------------------
 * Image fetching
 * -----------------------
 */
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

/**
 * -----------------------
 * Notices (ONLY)
 * -----------------------
 */
type NoticeItem = { bsDay: number; title: string };

async function loadMonthNotices(bsYear: number, bsMonth: number): Promise<NoticeItem[]> {
  const [rosters, schedules] = await Promise.all([
    prisma.fellowshiprosteritem.findMany({
      select: { assignedDate: true, groupNameOrEventTitle: true },
    }),
    prisma.generatedscheduleitem.findMany({
      select: { scheduledDate: true, groupNameOrEventTitle: true },
    }),
  ]);

  const out: NoticeItem[] = [];

  const add = (dateValue: Date | null, title: string) => {
    if (!dateValue) return;
    const bs = getBsDateParts(dateValue);
    if (!bs) return;
    if (bs.year !== bsYear || bs.month !== bsMonth) return;

    out.push({
      bsDay: bs.day,
      title: cleanNoticeTitle(title || "") || "Notice",
    });
  };

  rosters.forEach((r) => add(r.assignedDate ?? null, r.groupNameOrEventTitle ?? "Notice"));
  schedules.forEach((g) => add(g.scheduledDate ?? null, g.groupNameOrEventTitle ?? "Notice"));

  out.sort((a, b) => a.bsDay - b.bsDay);
  return out;
}

/**
 * -----------------------
 * Drawing helpers
 * -----------------------
 */
function drawHeader(doc: any, x: number, y: number, w: number) {
  doc.save();
  doc.rect(x, y, w, 50).fill("#f1f5f9");
  doc.fillColor("#0f172a").fontSize(18);
  writeTextWithFallback(doc, "Bishram Ekata Mandali", { x: x + 10, y: y + 9, width: w - 20 }, "bold");
  doc.fillColor("#334155").fontSize(9);
  writeTextWithFallback(
    doc,
    "Gauri Marg, Sinamangal, Kathmandu | www.bekatam.org",
    { x: x + 10, y: y + 32, width: w - 20 },
    "normal",
  );
  doc.restore();
}

function drawFooter(doc: any, x: number, y: number, w: number) {
  doc.save();
  doc.rect(x, y, w, 18).fill("#f1f5f9");
  doc.fillColor("#334155").fontSize(8);
  doc.text(`Generated at: ${new Date().toLocaleString()}`, x + 8, y + 5, { width: w - 16, align: "left" });
  doc.text("Calendar by: Bishram Ekata Mandali", x + 8, y + 5, { width: w - 16, align: "right" });
  doc.restore();
}

/**
 * Calendar page renderer (one month per page)
 * - Red color is for SATURDAY (Nepal)
 * - Today highlight (amber border)
 * - Green notice day shading
 * - Collage image block right after header (top 1/3)
 * - Notices block under calendar (bottom), auto-columns on right; empty area used for extra images
 */
function drawMonthPage(doc: any, opts: { bsYear: number; bsMonth: number; imageBuffers: Buffer[]; monthNotices: NoticeItem[] }) {
  const { bsYear, bsMonth, imageBuffers, monthNotices } = opts;

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const m = doc.page.margins;

  const x = m.left;
  const y = m.top;
  const w = pageW - m.left - m.right;

  // Layout ratios (usable height)
  const usableH = pageH - m.top - m.bottom;
  const topH = usableH * (1 / 3); // header + images
  const noticesH = usableH * (0.5 / 3);
  const footerH = usableH * (0.1 / 3);
  const calendarH = usableH - topH - noticesH - footerH;

  const topY = y;
  const calendarY = y + topH;
  const noticesY = calendarY + calendarH;
  const footerY = noticesY + noticesH;

  // ---------- TOP: header + collage ----------
  drawHeader(doc, x, topY, w);

  const headerH = 50;
  const collageY = topY + headerH + 6;
  const collageH = topH - headerH - 6;

  // Collage background
  doc.save();
  doc.rect(x, collageY, w, collageH).fill("#f8fafc");
  doc.restore();

  // 2x2 collage using up to 4 images
  const gap = 6;
  const tileW = (w - gap) / 2;
  const tileH = (collageH - gap) / 2;

  for (let i = 0; i < Math.min(imageBuffers.length, 4); i += 1) {
    const r = Math.floor(i / 2);
    const c = i % 2;
    const ix = x + c * (tileW + gap);
    const iy = collageY + r * (tileH + gap);
    try {
      doc.image(imageBuffers[i], ix, iy, { fit: [tileW, tileH], align: "center", valign: "center" });
    } catch {}
  }

  // ---------- CALENDAR: title + weekdays + grid ----------
  // Build month day map by converting BS days until it stops
  const adStart = bsToAd(bsYear, bsMonth, 1);
  const monthDays: Array<{ bsDay: number; ad: Date }> = [];
  for (let d = 1; d <= 40; d += 1) {
    try {
      const ad = bsToAd(bsYear, bsMonth, d);
      const bs = getBsDateParts(ad);
      if (!bs || bs.year !== bsYear || bs.month !== bsMonth || bs.day !== d) break;
      monthDays.push({ bsDay: d, ad });
    } catch {
      break;
    }
  }
  const adEnd = monthDays.length ? monthDays[monthDays.length - 1].ad : adStart;

  const fmtMonth = (dt: Date) => dt.toLocaleString("en-US", { month: "long" });
  const fmtYear = (dt: Date) => dt.toLocaleString("en-US", { year: "numeric" });

  const adLabel =
    fmtMonth(adStart) === fmtMonth(adEnd)
      ? `${fmtMonth(adStart)} ${fmtYear(adStart)}`
      : `${fmtMonth(adStart)}–${fmtMonth(adEnd)} ${fmtYear(adEnd)}`;

  // Notices map
  const noticesByDay = new Map<number, NoticeItem[]>();
  monthNotices.forEach((n) => {
    const list = noticesByDay.get(n.bsDay) ?? [];
    list.push(n);
    noticesByDay.set(n.bsDay, list);
  });

  // Today in BS
  const todayBs = getBsDateParts(new Date());

  // Title strip (BS + AD)
  const titleStripH = 28;
  doc.save();
  doc.rect(x, calendarY, w, titleStripH).fill("#0ea5e9");
  doc.fillColor("#ffffff").fontSize(12);
  writeTextWithFallback(
    doc,
    `${BS_MONTH_NAMES_NP[bsMonth - 1]} ${bsYear} ( ${adLabel} )`,
    { x: x + 10, y: calendarY + 8, width: w - 20 },
    "bold",
  );
  doc.restore();

  const gridTop = calendarY + titleStripH + 6;
  const gridH = calendarH - titleStripH - 6;

  const dayNamesEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNamesNP = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];

  const cols7 = 7;
  const rows6 = 6;

  const headerRowH = 22;
  const cellW = w / cols7;
  const bodyCellH = (gridH - headerRowH) / rows6;

  // Weekday header row (EN top, NP bottom). RED is SATURDAY (index 6)
  for (let c = 0; c < cols7; c += 1) {
    const hx = x + c * cellW;
    const isSaturday = c === 6;

    doc.save();
    doc.rect(hx, gridTop, cellW, headerRowH).fillAndStroke("#f1f5f9", "#cbd5e1");
    doc.restore();

    doc.fillColor(isSaturday ? "#dc2626" : "#0f172a").fontSize(8);
    doc.text(dayNamesEN[c], hx, gridTop + 3, { width: cellW, align: "center" });

    doc.fillColor(isSaturday ? "#dc2626" : "#334155").fontSize(8);
    writeTextWithFallback(doc, dayNamesNP[c], { x: hx, y: gridTop + 12, width: cellW, align: "center" }, "bold");
  }

  // Grid body
  const bodyY = gridTop + headerRowH;
  const startWeekday = adStart.getDay(); // 0=Sun

  for (let r = 0; r < rows6; r += 1) {
    for (let c = 0; c < cols7; c += 1) {
      const cx = x + c * cellW;
      const cy = bodyY + r * bodyCellH;

      // border
      doc.save();
      doc.strokeColor("#cbd5e1").lineWidth(1);
      doc.rect(cx, cy, cellW, bodyCellH).stroke();
      doc.restore();

      const slot = r * cols7 + c;
      const bsDay = slot - startWeekday + 1;
      if (bsDay < 1 || bsDay > monthDays.length) continue;

      const ad = monthDays[bsDay - 1].ad;
      const adDay = ad.getDate();
      const prevAd = bsDay > 1 ? monthDays[bsDay - 2]?.ad : null;
      const isFirstAdOfMonth = !prevAd || prevAd.getMonth() !== ad.getMonth();

      const isSaturday = c === 6;
      const hasNotice = (noticesByDay.get(bsDay) ?? []).length > 0;
      const isToday = !!todayBs && todayBs.year === bsYear && todayBs.month === bsMonth && todayBs.day === bsDay;

      // Notice day shading (green tint)
      if (hasNotice) {
        doc.save();
        // pdfkit supports fillOpacity; if not, it will just ignore
        if (typeof doc.fillOpacity === "function") doc.fillOpacity(0.08);
        doc.rect(cx + 1, cy + 1, cellW - 2, bodyCellH - 2).fill("#16a34a");
        if (typeof doc.fillOpacity === "function") doc.fillOpacity(1);
        doc.restore();
      }

      // Today highlight (amber border)
      if (isToday) {
        doc.save();
        doc.strokeColor("#f59e0b").lineWidth(2);
        doc.rect(cx + 2, cy + 2, cellW - 4, bodyCellH - 4).stroke();
        doc.restore();
      }

      // AD small top-right
      doc.fillColor(isSaturday ? "#dc2626" : "#475569").fontSize(8);
      doc.text(String(adDay), cx, cy + 6, { width: cellW - 6, align: "right" });

      // AD month short name on first AD day
      if (isFirstAdOfMonth) {
      doc.fillColor("#2563eb").fontSize(7);
      doc.text(
      adMonthShort(ad),
      cx + 4,
      cy + 4,
      { width: cellW - 8, align: "left" }
    );
   }

      // BS big centered
      doc.fillColor(isSaturday ? "#dc2626" : "#0f172a").fontSize(18);
      writeTextWithFallback(
        doc,
        String(bsDay),
        { x: cx, y: cy + bodyCellH / 2 - 10, width: cellW, align: "center" },
        "bold",
      );
    }
  }

  // ---------- NOTICES block (bottom) ----------
  doc.save();
  doc.rect(x, noticesY, w, noticesH).fillAndStroke("#ffffff", "#cbd5e1");
  doc.restore();

  doc.fillColor("#0f172a").fontSize(11);
  writeTextWithFallback(doc, "Notices", { x: x + 10, y: noticesY + 8, width: w - 20 }, "bold");

  const lines = monthNotices.map((n) => ({ bsDay: n.bsDay, title: n.title }));

  const topPad = 30;
  const lineH = 14;
  const availableH = noticesH - topPad - 10;
  const linesPerCol = Math.max(6, Math.floor(availableH / lineH));

  // Auto columns (up to 3)
  const colCount = Math.min(3, Math.max(1, Math.ceil(lines.length / linesPerCol)));
  const colGap = 12;

  // Notices align to RIGHT; left empty area can be used for extra images
  const maxNoticeWidth = w * 0.65;
  const colW = Math.min(240, (maxNoticeWidth - colGap * (colCount - 1)) / colCount);
  const noticesW = colW * colCount + colGap * (colCount - 1);
  const noticesX = x + (w - noticesW) - 10;
  const noticesStartY = noticesY + topPad;

  let idx = 0;
  for (let c = 0; c < colCount; c += 1) {
    const cx = noticesX + c * (colW + colGap);
    let cy = noticesStartY;

    for (let i = 0; i < linesPerCol && idx < lines.length; i += 1, idx += 1) {
      const item = lines[idx];

      // Green "date badge" with border (green shadow 느낌)
      const badgeW = 30;
      const badgeH = 12;

      doc.save();
      doc.rect(cx + 1, cy + 2, badgeW, badgeH).fill("#bbf7d0"); // light green base
      doc.strokeColor("#16a34a").lineWidth(1).rect(cx + 1, cy + 2, badgeW, badgeH).stroke();
      doc.restore();

      doc.fillColor("#166534").fontSize(8);
      doc.text(pad2(item.bsDay), cx + 1, cy + 3, { width: badgeW, align: "center" });

      doc.fillColor("#0f172a").fontSize(9);
      drawNoticeTitleSingleLine(doc, item.title, cx + badgeW + 8, cy, colW - badgeW - 10);

      cy += lineH;
    }
  }

  // Extra images in remaining LEFT area of notices block (after top 4 images)
  const leftAreaW = (noticesX - x) - 10;
  if (leftAreaW > 80) {
    const extraY = noticesY + topPad;
    const extraH = noticesH - topPad - 10;

    const extras = imageBuffers.slice(4, 8); // remaining images
    if (extras.length) {
      const g = 6;

      const cols = extras.length >= 2 ? 2 : 1;
      const rows = extras.length >= 3 ? 2 : 1;

      const tileW2 = (leftAreaW - g) / cols;
      const tileH2 = (extraH - g) / rows;

      doc.save();
      doc.rect(x + 10, extraY, leftAreaW, extraH).fill("#f8fafc");
      doc.restore();

      for (let i = 0; i < Math.min(extras.length, 4); i += 1) {
        const rr = Math.floor(i / 2);
        const cc = i % 2;
        const ix = x + 10 + cc * (tileW2 + g);
        const iy = extraY + rr * (tileH2 + g);
        try {
          doc.image(extras[i], ix, iy, { fit: [tileW2, tileH2], align: "center", valign: "center" });
        } catch {}
      }
    }
  }

  // ---------- FOOTER ----------
  drawFooter(doc, x, footerY + (footerH - 18), w);
}

/**
 * -----------------------
 * Controller: 12 pages (one per month)
 * No bsMonth param needed
 * -----------------------
 */
export const getCalendarPdf = async (req: Request, res: Response) => {
  const bsYear = Number(String(req.query.bsYear || "").trim());

  const paper = String(req.query.paperSize || "a4").toLowerCase();
  const allowed = new Set(["a4", "a3", "a2", "a1"]);
  const safePaper = allowed.has(paper) ? paper : "a4";

  if (!bsYear || Number.isNaN(bsYear)) return res.status(400).json({ message: "Missing bsYear" });

  try {
    // Multiple images from HomeSlide
    const slides = await prisma.homeslide.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { imageUrl: true },
      take: 8,
    });

    const imageBuffers: Buffer[] = [];
    for (const s of slides) {
      if (!s.imageUrl) continue;
      const buf = await fetchImageBuffer(s.imageUrl);
      if (buf) imageBuffers.push(buf);
    }

    setPdfHeaders(res, `BEM_Calendar_${bsYear}_${safePaper}.pdf`);
    const doc = createDoc(res, safePaper);

    for (let i = 0; i < 12; i += 1) {
      const month = i + 1;
      const monthNotices = await loadMonthNotices(bsYear, month);

      if (i > 0) doc.addPage();
      drawMonthPage(doc, { bsYear, bsMonth: month, imageBuffers, monthNotices });
    }

    doc.end();
  } catch (err) {
    console.error("calendarPdfController getCalendarPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate calendar PDF" });
    try {
      res.end();
    } catch {}
  }
};
