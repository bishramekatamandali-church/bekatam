import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../db";
import { BS_MONTH_NAMES_NP, formatDateADBS, formatDateADBSShort, getBsDateParts } from "../utils/dateFormatters";
import { pdfTextMixed, registerPdfFonts } from "../utils/pdfFonts";
import { handleDatabaseFallback } from "../utils/databaseFallback";
import {
  addDonorDonation,
  buildRefinedDonorList,
  normalizeDateRange,
  DonorDonationEntry,
  DonorListEntry,
  RefinedDonorEntry,
} from "../utils/donorListReport";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require("pdfkit");


/**
 * Fonts:
 * - Source: backend/assets/fonts/*.ttf
 * - Copied to: backend/dist/assets/fonts/*.ttf by scripts/copy-assets.js
 * - Runtime __dirname: backend/dist/controllers
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

type FellowshipScheduleItem = {
  timeLabel: string;
  title: string;
  speakerName?: string;
  details?: string;
};


function setPdfHeaders(res: Response, filename: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
}

function createDoc(res: Response, options: { bufferPages?: boolean } = {}) {
  ensureFontExists(FONT_LATIN_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_BOLD);
  if (!fs.existsSync(FONT_EMOJI_REGULAR)) {
    console.warn("Emoji font missing, emoji rendering may be limited:", FONT_EMOJI_REGULAR);
  }

  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: options.bufferPages ?? false });
  doc.pipe(res);
  doc.font(FONT_LATIN_REGULAR);
  return doc;
}

function resolveRunType(char: string): TextRunType {
  if (EMOJI_REGEX.test(char)) return "emoji";
  if (DEVANAGARI_REGEX.test(char)) return "devanagari";
  return "latin";
}

function setFontForRun(doc: any, runType: TextRunType, style: "normal" | "bold" = "normal") {
  if (runType === "emoji" && fs.existsSync(FONT_EMOJI_REGULAR)) {
    doc.font(FONT_EMOJI_REGULAR);
    return;
  }
  if (runType === "devanagari") {
    doc.font(style === "bold" ? FONT_DEVANAGARI_BOLD : FONT_DEVANAGARI_REGULAR);
  return;
  }
  doc.font(FONT_LATIN_REGULAR);
}

function writeTextWithFallback(
  doc: any,
  text: string,
  options: {
    continued?: boolean;
    align?: "left" | "center" | "right" | "justify";
    width?: number;
    x?: number;
    y?: number;
  } = {},
  style: "normal" | "bold" = "normal",
) {
  const value = String(text ?? "");
  if (!value) {
    doc.text("", { continued: options.continued });
    return;
  }

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

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    setFontForRun(doc, segment.type, style);
    if (index === 0 && (x !== undefined || y !== undefined)) {
      doc.text(segment.text, x, y, { ...textOptions, continued: isLast ? options.continued : true });
      return;
    }
    doc.text(segment.text, { ...textOptions, continued: isLast ? options.continued : true });
  });
}

function writeLine(doc: any, label: string, value: any) {
  const l = label === null || label === undefined ? "" : String(label);
  const v = value === null || value === undefined ? "" : String(value);
  
  doc.fontSize(11);
  writeTextWithFallback(doc, l, { continued: true }, "normal");
  writeTextWithFallback(doc, v || "", { continued: false }, "normal");
}

function writeBlock(doc: any, title: string, body: any) {
  const t = String(title || "");
  const b = body === null || body === undefined ? "" : String(body);

  doc.fontSize(12);
  writeTextWithFallback(doc, t, { continued: false }, "bold");

  doc.fontSize(10);
  writeTextWithFallback(doc, b, { continued: false }, "normal");

  doc.moveDown(0.5);
}

const buildFellowshipSchedulePdf = (
  doc: any,
  params: {
    churchName: string;
    items: FellowshipScheduleItem[];
  },
) => {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;

  doc.info.Title = "Fellowship Schedule";
  doc.x = margin;

  // Header
  doc.fontSize(16);
  writeTextWithFallback(doc, params.churchName, { width: contentWidth }, "bold");
  doc.moveDown(0.5);

  doc.fontSize(14);
  writeTextWithFallback(doc, "Fellowship Schedule", { width: contentWidth }, "bold");
  doc.moveDown(0.3);

  doc.moveTo(margin, doc.y).lineTo(margin + contentWidth, doc.y).stroke();
  doc.moveDown(0.6);

  // Body
  doc.fontSize(11);
  for (const item of params.items) {
    const line1 = item.timeLabel ? `${item.timeLabel} - ${item.title}` : item.title;
    doc.x = margin;
    writeTextWithFallback(doc, line1, { width: contentWidth }, "bold");

    if (item.speakerName) {
      doc.x = margin + 12;
      writeTextWithFallback(
        doc,
        `Speaker: ${item.speakerName}`,
        { width: contentWidth - 12 },
        "normal",
      );
    }

    if (item.details) {
      doc.x = margin + 12;
      writeTextWithFallback(doc, item.details, { width: contentWidth - 12 }, "normal");
    }

    doc.moveDown(0.5);
  }

  // Footer
  const footerY = doc.page.height - doc.page.margins.bottom + 14;
  doc.fontSize(9);
  writeTextWithFallback(
    doc,
    params.churchName,
    { x: margin, y: footerY, width: contentWidth, align: "center" },
    "bold",
  );
};

function formatLocalTimestamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

const buildDonorListPdfBuffer = (
  params: {
  title: string;
  churchName: string;
  headerBsLine: string;
  headerAdLine: string;
  totalDonors: number;
  totalDonated: number;
},

  donors: DonorListEntry[],
  refinedDonors: RefinedDonorEntry[],
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
      const fontRegistry = registerPdfFonts(doc);

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const line = (text: string, options?: Record<string, unknown>) => {
        pdfTextMixed(doc, fontRegistry, text, options as any);
      };

      const headerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const marginLeft = doc.page.margins.left;
const marginRight = doc.page.margins.right;

const formatNpr = (amount: number) => `NPR ${Number(amount || 0).toFixed(2)}`;

       const drawHeader = (pageNumber: number, totalPages: number) => {
  // 🔒 Save cursor position (VERY IMPORTANT)
  const prevX = doc.x;
  const prevY = doc.y;

  doc.save();

  // Start drawing header at top margin (visual only)
  doc.y = doc.page.margins.top;

  // --- HEADER CONTENT ---
  doc.font(FONT_LATIN_REGULAR).fontSize(18).fillColor("#0f172a");
  doc.text(params.churchName, doc.page.margins.left, doc.y, {
    width: headerWidth,
    align: "center",
  });

  doc.moveDown(0.25);

  doc.font(FONT_LATIN_REGULAR).fontSize(14);
  doc.text(params.title, doc.page.margins.left, doc.y, {
    width: headerWidth,
    align: "center",
  });

  doc.moveDown(0.15);

  // BS line
  doc.font(FONT_DEVANAGARI_REGULAR).fontSize(11).fillColor("#555555");
  doc.text(params.headerBsLine, doc.page.margins.left, doc.y, {
    width: headerWidth,
    align: "center",
  });

  doc.moveDown(0.10);

  // AD line
  doc.font(FONT_LATIN_REGULAR).fontSize(10).fillColor("#666666");
  doc.text(params.headerAdLine, doc.page.margins.left, doc.y, {
    width: headerWidth,
    align: "center",
  });

  doc.moveDown(0.20);

  // Summary + page number
  doc.font(FONT_LATIN_REGULAR).fontSize(9).fillColor("#475569");
  doc.text(
    `Total Donors: ${params.totalDonors}   |   Total Donated: NPR ${params.totalDonated.toFixed(
      2
    )}   |   Page ${pageNumber} of ${totalPages}`,
    doc.page.margins.left,
    doc.y,
    { width: headerWidth, align: "center" }
  );

  doc.moveDown(0.35);

  // Divider
  doc.strokeColor("#cbd5f5");
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.restore();

  // 🔒 Restore cursor position so body layout is NOT affected
  doc.x = prevX;
  doc.y = prevY;
};



       // Reserve space for header so content never overlaps it (ALL pages)
      const headerBlockHeight = 120;
      const contentStartY = doc.page.margins.top + headerBlockHeight;

      // Apply for first page
      doc.y = contentStartY;

      // Apply automatically for every new page created by PDFKit (auto page breaks)
      doc.on("pageAdded", () => {
      doc.y = contentStartY;
     });



      donors.forEach((donor, index) => {
        if (index > 0) {
          doc.moveDown(0.5);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.6);
        }

        doc.fontSize(12);
        line(donor.donorName);

        doc.fontSize(10).fillColor("#555555");
        if (donor.address) line(`Address: ${donor.address}`);
        if (donor.contact) line(`Contact: ${donor.contact}`);
        line(`Total Donated: NPR ${Number(donor.totalAmount || 0).toFixed(2)}`);
        doc.fillColor("#000000");

        if (donor.donations.length > 0) {
          doc.moveDown(0.3);
          donor.donations.forEach((donation) => {
            const purposeLabel = donation.purpose ? ` - ${donation.purpose}` : "";
            const bullet = `• ${formatDateADBS(donation.date)} - NPR ${Number(donation.amount || 0).toFixed(2)}${purposeLabel}`;
            doc.fontSize(9);
            line(bullet);
          });
        }
      });

      if (refinedDonors.length > 0) {
        doc.addPage();
        doc.y = contentStartY; // <-- add this line

        const heading = "Refined donors list";
        doc.fontSize(16);
        line(heading);
        doc.moveDown(0.6);

        refinedDonors.forEach((donor, index) => {
          if (index > 0) {
            doc.moveDown(0.4);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.4);
          }

          const mergedLabel = donor.mergedCount > 1 ? ` (merged ${donor.mergedCount})` : "";
          const purposes = donor.purposes.length > 0 ? donor.purposes.join(", ") : "—";

          line(`${donor.donorName}${mergedLabel}`);
          doc.fontSize(10).fillColor("#555555");
          line(`Address: ${donor.address ?? "—"}`);
          line(`Contact: ${donor.contact ?? "—"}`);
          line(`Total Donated: NPR ${Number(donor.totalAmount || 0).toFixed(2)}`);
          line(`Purposes: ${purposes}`);
          doc.fillColor("#000000");
        });
      }
      // Draw header on every page with correct total pages
const range = doc.bufferedPageRange();
const totalPages = range.count;

for (let i = range.start; i < range.start + range.count; i += 1) {
  doc.switchToPage(i);
  drawHeader(i + 1, totalPages);

  // Re-apply content start Y (important if any page was switched before writing ended)
  // Not strictly required here since we draw after all content, but safe to keep layout stable.
}


      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const getTestPdf = async (_req: Request, res: Response) => {
  try {
    setPdfHeaders(res, "pdf-font-test.pdf");
    const doc = createDoc(res);

    doc.fontSize(18);
    writeTextWithFallback(doc, "BEM PDF Test", { continued: false, align: "center" }, "bold");
    doc.moveDown(1);

    writeLine(doc, "English: ", "Hello World");
    doc.moveDown(0.3);
    writeLine(doc, "Nepali: ", "नमस्ते संसार");
    doc.moveDown(0.3);

    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getTestPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate test PDF" });
    try {
      res.end();
    } catch {}
  }
};

export const getMeetingPdf = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Missing meeting id" });

    const meeting =
      (await (prisma as any).meetinglog?.findUnique?.({ where: { id } })) ??
      (await (prisma as any).meetingLog?.findUnique?.({ where: { id } }));

    if (!meeting) return res.status(404).json({ message: "Meeting log not found" });

    setPdfHeaders(res, `Meeting_${id}.pdf`);
    const doc = createDoc(res);

    doc.fontSize(18);
    writeTextWithFallback(doc, "Bishram Ekata Mandali", { continued: false, align: "center" }, "bold");
    doc.fontSize(14);
    writeTextWithFallback(doc, "Meeting Log", { continued: false, align: "center" }, "bold");
    doc.moveDown(1);

    writeLine(doc, "Title: ", meeting.title || "");
    writeLine(doc, "Date: ", formatDateADBSShort(meeting.meetingDate));
    writeLine(doc, "Type: ", meeting.meetingType || "");
    writeLine(doc, "Status: ", meeting.status || "");
    doc.moveDown(0.5);

    if (meeting.attendees) writeBlock(doc, "Attendees:", meeting.attendees);
    if (meeting.agenda) writeBlock(doc, "Agenda:", meeting.agenda);
    if (meeting.minutes) writeBlock(doc, "Minutes:", meeting.minutes);

    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getMeetingPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate meeting PDF" });
    try {
      res.end();
    } catch {}
  }
};

export const getDecisionPdf = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Missing decision id" });

    const decision =
      (await (prisma as any).decisionlog?.findUnique?.({ where: { id } })) ??
      (await (prisma as any).decisionLog?.findUnique?.({ where: { id } }));

    if (!decision) return res.status(404).json({ message: "Decision log not found" });

    setPdfHeaders(res, `Decision_${id}.pdf`);
    const doc = createDoc(res);

    doc.fontSize(18);
    writeTextWithFallback(doc, "Bishram Ekata Mandali", { continued: false, align: "center" }, "bold");
    doc.fontSize(14);
    writeTextWithFallback(doc, "Decision Record", { continued: false, align: "center" }, "bold");
    doc.moveDown(1);

    writeLine(doc, "Title: ", decision.title || "");
    writeLine(doc, "Date: ", formatDateADBSShort(decision.decisionDate));
    writeLine(doc, "Made By: ", decision.madeBy || "");
    writeLine(doc, "Status: ", decision.status || "");
    doc.moveDown(0.5);

    if (decision.description) writeBlock(doc, "Description:", decision.description);

    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getDecisionPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate decision PDF" });
    try {
      res.end();
    } catch {}
  }
};

export const getCollectionRecordPdf = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Missing collection record id" });

    const record =
      (await (prisma as any).collectionrecord?.findUnique?.({
        where: { id },
        include: { donordetail: true },
      })) ??
      (await (prisma as any).collectionRecord?.findUnique?.({
        where: { id },
        include: { donordetail: true },
      }));

    if (!record) return res.status(404).json({ message: "Collection record not found" });

    setPdfHeaders(res, `Collection_Record_${id}.pdf`);
    const doc = createDoc(res);

    doc.fontSize(18);
    writeTextWithFallback(doc, "Bishram Ekata Mandali", { continued: false, align: "center" }, "bold");
    doc.fontSize(14);
    writeTextWithFallback(doc, "Collection Record", { continued: false, align: "center" }, "bold");
    doc.moveDown(1);

    writeLine(doc, "Purpose: ", record.purpose || "");
    writeLine(doc, "Date: ", formatDateADBSShort(record.collectionDate));
    writeLine(doc, "Collector: ", record.collectorName || "");
    writeLine(doc, "Amount: NPR ", Number(record.amount ?? 0).toFixed(2));
    writeLine(doc, "Deposited: ", record.isDeposited ? "Yes" : "No");
    doc.moveDown(0.5);

    const donors = Array.isArray(record.donordetail) ? record.donordetail : [];
    if (donors.length) {
      doc.fontSize(12);
      writeTextWithFallback(doc, "Donors:", { continued: false }, "bold");
      doc.moveDown(0.2);

      donors.forEach((d: any, idx: number) => {
        const name = d.donorName || "";
        const amount = Number(d.amount ?? 0).toFixed(2);
        const contact = d.contact ? ` (${d.contact})` : "";
        const line = `${idx + 1}. ${name} - NPR ${amount}${contact}`;
        doc.fontSize(10);
        writeTextWithFallback(doc, line, { continued: false }, "normal");
      });

      doc.moveDown(0.4);
    }

    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getCollectionRecordPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate collection record PDF" });
    try {
      res.end();
    } catch {}
  }
};

const formatCurrency = (amount: number) => `NPR ${Number(amount ?? 0).toFixed(2)}`;



/* CHURCH HISTORY CHAPTER PDF*/

export const getHistoryChapterPdf = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Missing history chapter id" });

    const chapter =
      (await (prisma as any).historychapter?.findUnique?.({ where: { id } })) ??
      (await (prisma as any).historyChapter?.findUnique?.({ where: { id } }));

    if (!chapter) return res.status(404).json({ message: "History chapter not found" });

    const chapterLabel = chapter.chapterNumber ? `Chapter_${chapter.chapterNumber}` : `Chapter_${id}`;
    setPdfHeaders(res, `${chapterLabel}.pdf`);
    const doc = createDoc(res);

    doc.fontSize(18);
    writeTextWithFallback(doc, "Bishram Ekata Mandali", { continued: false, align: "center" }, "bold");
    doc.fontSize(14);
    writeTextWithFallback(doc, "Church History", { continued: false, align: "center" }, "bold");
    doc.moveDown(1);

    doc.fontSize(16);
    writeTextWithFallback(doc, `Chapter ${chapter.chapterNumber ?? ""}: ${chapter.title ?? ""}`.trim(), { continued: false }, "bold");
    doc.moveDown(0.5);

    if (chapter.authorName) writeLine(doc, "Author: ", chapter.authorName);
    if (chapter.lastPublishedAt || chapter.createdAt) {
      const dateValue = chapter.lastPublishedAt || chapter.createdAt;
      writeLine(doc, "Date: ", formatDateADBS(dateValue));
    }
    doc.moveDown(0.6);

    if (chapter.content) {
      doc.fontSize(11);
      writeTextWithFallback(doc, chapter.content, { continued: false });
      doc.moveDown(0.4);
    }

    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getHistoryChapterPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate history chapter PDF" });
    try {
      res.end();
    } catch {}
  }
};



/* CHURCH MEMBER PDF */

export const getChurchMemberPdf = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Missing church member id" });

    const member =
      (await (prisma as any).churchmember?.findUnique?.({ where: { id } })) ??
      (await (prisma as any).churchMember?.findUnique?.({ where: { id } }));

    if (!member) return res.status(404).json({ message: "Church member not found" });

    const safeName = String(member.fullName || "Member").replace(/\s+/g, "_");
    setPdfHeaders(res, `${safeName}_profile.pdf`);
    const doc = createDoc(res);

    doc.fontSize(16);
    writeTextWithFallback(doc, "Bishram Ekata Mandali", { continued: false, align: "center" }, "bold");
    doc.fontSize(13);
    writeTextWithFallback(doc, "Member Profile", { continued: false, align: "center" }, "bold");
    doc.moveDown(1);

    writeLine(doc, "Full Name: ", member.fullName || "");
    writeLine(doc, "Email: ", member.contactEmail || "");
    writeLine(doc, "Phone: ", member.contactPhone || "");
    writeLine(doc, "Address: ", member.address || "");
    if (member.memberSince) writeLine(doc, "Member Since: ", formatDateADBS(member.memberSince));
    if (member.dateOfBirth) writeLine(doc, "Date of Birth: ", formatDateADBS(member.dateOfBirth));
    if (member.baptismDate) writeLine(doc, "Baptism Date: ", formatDateADBS(member.baptismDate));
     writeLine(doc, "Member Status: ", member.memberStatus || (member.isActiveMember ? "Active" : "Left"));
    if (member.deactivatedDate) writeLine(doc, "Deactivated/Left Date: ", formatDateADBS(member.deactivatedDate));
    if (member.familyMembers) writeLine(doc, "Family Members: ", member.familyMembers);
    if (member.notes) writeBlock(doc, "Notes:", member.notes);

    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getChurchMemberPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate church member PDF" });
    try {
      res.end();
    } catch {}
  }
};



/* FINANCIAL SUMMARY PDF */

export const getFinancialSummaryPdf = async (req: Request, res: Response) => {
  try {
    const parseDate = (value: unknown) => {
      if (!value) return null;
      const text = Array.isArray(value)
        ? typeof value[0] === "string"
          ? value[0]
          : null
        : typeof value === "string"
          ? value
          : null;
      if (!text) return null;
      const parsed = new Date(text);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startDate = parseDate(req.query.startDate);
    const endDateRaw = parseDate(req.query.endDate);
    const endDate = endDateRaw ? new Date(endDateRaw) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const dateFilter = (field: string) => {
      if (!startDate && !endDate) return undefined;
      return {
        [field]: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        },
      };
    };

    const [donations, collections, expenses] = await Promise.all([
      (prisma as any).donationrecord?.findMany?.({ where: dateFilter("donationDate") }) ??
        (await (prisma as any).donationRecord?.findMany?.({ where: dateFilter("donationDate") })),
      (prisma as any).collectionrecord?.findMany?.({ where: dateFilter("collectionDate") }) ??
        (await (prisma as any).collectionRecord?.findMany?.({ where: dateFilter("collectionDate") })),
      (prisma as any).expenserecord?.findMany?.({ where: dateFilter("expenseDate") }) ??
        (await (prisma as any).expenseRecord?.findMany?.({ where: dateFilter("expenseDate") })),
    ]);

    const transactionLog: Array<{
      date: string;
      type: "Income" | "Expense";
      category: string;
      description: string;
      amount: number;
    }> = [];

    let totalIncome = 0;
    let totalExpense = 0;

    (donations || []).forEach((record: any) => {
      const amount = Number(record.amount ?? 0);
      transactionLog.push({
        date: record.donationDate,
        type: "Income",
        category: record.purpose || "",
        description: `Donation from ${record.donorName || "Donor"}`,
        amount,
      });
      totalIncome += amount;
    });

    (collections || []).forEach((record: any) => {
      const amount = Number(record.amount ?? 0);
      transactionLog.push({
        date: record.collectionDate,
        type: "Income",
        category: record.purpose || "",
        description: `Collection by ${record.collectorName || "Collector"}`,
        amount,
      });
      totalIncome += amount;
    });

    (expenses || []).forEach((record: any) => {
      const amount = Number(record.amount ?? 0);
      transactionLog.push({
        date: record.expenseDate,
        type: "Expense",
        category: record.category || "",
        description: record.description || "",
        amount,
      });
      totalExpense += amount;
    });

    transactionLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filename = `financial_summary_${startDate?.toISOString().slice(0, 10) || "start"}_to_${
      endDate?.toISOString().slice(0, 10) || "end"
    }.pdf`;
    setPdfHeaders(res, filename);
    const doc = createDoc(res, { bufferPages: true });
    
    // --- Date range parsing helpers (keep only ONE copy; remove duplicates) ---
const splitDateLabel = (value: string) => {
  const trimmed = String(value ?? "").trim();
  const match = trimmed.match(/^(.*)\s+\((.*)\)\s*$/);
  if (!match) return { bs: trimmed, ad: "" };
  return { bs: match[1].trim(), ad: match[2].trim() };
};

const startLabel = startDate ? formatDateADBSShort(startDate) : "Start";
const endLabel = endDate ? formatDateADBSShort(endDate) : "End";
const startParts = splitDateLabel(startLabel);
const endParts = splitDateLabel(endLabel);

// Short + predictable (prevents wrap/overlap)
const lineBS = `${startParts.bs} देखि ${endParts.bs}`; // Nepali BS range
const lineAD = startParts.ad && endParts.ad ? `${startParts.ad} to ${endParts.ad}` : "";

// --- Page metrics ---
const marginLeft = doc.page.margins.left;
const marginRight = doc.page.margins.right;
const pageWidth = doc.page.width;
const pageHeight = doc.page.height;
const headerWidth = pageWidth - marginLeft - marginRight;

// --- Measure header height using the SAME fonts you will draw with ---
const headerY = doc.page.margins.top - 10;
const dateFontSize = 9;
const dateGap = lineAD ? 2 : 0;

// measure BS (Devanagari)
doc.font(FONT_DEVANAGARI_REGULAR).fontSize(dateFontSize);
const bsLineH = doc.heightOfString(lineBS, { width: headerWidth, align: "center" });

// measure AD (Latin)
let adLineH = 0;
if (lineAD) {
  doc.font(FONT_LATIN_REGULAR).fontSize(dateFontSize);
  adLineH = doc.heightOfString(lineAD, { width: headerWidth, align: "center" });
}

// Titles area: 2 headings (about 30px) + date lines + rule gap
const titlesHeight = 30; // Bishram + Financial Summary block height
const headerRuleGap = 8;
const headerHeight = titlesHeight + bsLineH + dateGap + adLineH + headerRuleGap;

const footerHeight = 46;
const contentTop = doc.page.margins.top + headerHeight;
const contentBottom = pageHeight - doc.page.margins.bottom - footerHeight;

// --- Draw header/footer on each page (NO re-definitions inside) ---
const drawHeaderFooter = (pageNumber: number, totalPages: number) => {
  const headerRuleY = headerY + titlesHeight + bsLineH + dateGap + adLineH + 6;

  doc.save();

  // Titles
  doc.fillColor("#0f172a");
  doc.font(FONT_LATIN_REGULAR).fontSize(13);
  doc.text("Bishram Ekata Mandali", marginLeft, headerY, { width: headerWidth, align: "center" });

  doc.font(FONT_LATIN_REGULAR).fontSize(12);
  doc.text("Financial Summary", marginLeft, headerY + 16, { width: headerWidth, align: "center" });

  // Date lines (draw with fixed fonts => no messy wrap order)
  doc.fillColor("#475569");

  // BS line (Devanagari)
  doc.font(FONT_DEVANAGARI_REGULAR).fontSize(dateFontSize);
  doc.text(lineBS, marginLeft, headerY + titlesHeight, { width: headerWidth, align: "center" });

  // AD line (Latin)
  if (lineAD) {
    doc.font(FONT_LATIN_REGULAR).fontSize(dateFontSize);
    doc.text(lineAD, marginLeft, headerY + titlesHeight + bsLineH + dateGap, {
      width: headerWidth,
      align: "center",
    });
  }

  // Header rule
  doc.moveTo(marginLeft, headerRuleY)
    .lineTo(pageWidth - marginRight, headerRuleY)
    .strokeColor("#cbd5f5")
    .stroke();

  // Footer
  const footerY = pageHeight - doc.page.margins.bottom + 12;
  doc.strokeColor("#e2e8f0");
  doc.moveTo(marginLeft, footerY - 8).lineTo(pageWidth - marginRight, footerY - 8).stroke();

  doc.fillColor("#475569");
  doc.font(FONT_LATIN_REGULAR).fontSize(9);
  doc.text(`Page ${pageNumber} of ${totalPages}`, 0, footerY, { align: "center" });

  doc.restore();
};
      
    doc.y = contentTop;

    const summaryBoxTop = doc.y;
    const summaryBoxPadding = 12;
    const summaryBoxWidth = pageWidth - marginLeft - marginRight;
    const summaryBoxHeight = 74;
    doc.roundedRect(marginLeft, summaryBoxTop, summaryBoxWidth, summaryBoxHeight, 6).strokeColor("#cbd5f5").stroke();

    doc.fontSize(11);
    doc.fillColor("#0f172a");
    const summaryLabelY = summaryBoxTop + summaryBoxPadding;
    doc.text(`Total Income: ${formatCurrency(totalIncome)}`, marginLeft + summaryBoxPadding, summaryLabelY);
    doc.text(
      `Total Expense: ${formatCurrency(totalExpense)}`,
      marginLeft + summaryBoxWidth / 2,
      summaryLabelY,
    );
    doc.text(`Net Balance: ${formatCurrency(totalIncome - totalExpense)}`, marginLeft + summaryBoxPadding, summaryLabelY + 24);
    doc.text(
      `Generated at: ${formatLocalTimestamp()}`,
      marginLeft + summaryBoxWidth / 2,
      summaryLabelY + 24,
    );

    doc.y = summaryBoxTop + summaryBoxHeight + 18;

    doc.fontSize(12);
    writeTextWithFallback(doc, "Transactions", { continued: false }, "bold");
    doc.moveDown(0.4);

    const tableStartX = marginLeft;
    const tableWidth = pageWidth - marginLeft - marginRight;
    const columns = [
      { key: "date", label: "Date", width: 0.2 },
      { key: "type", label: "Type", width: 0.12 },
      { key: "category", label: "Category", width: 0.18 },
      { key: "description", label: "Description", width: 0.34 },
      { key: "amount", label: "Amount", width: 0.16 },
    ];
    const columnWidths = columns.map((col) => col.width * tableWidth);
    const columnPositions = columnWidths.reduce<number[]>((acc, width, idx) => {
      const prev = acc[idx - 1] ?? tableStartX;
      acc.push(idx === 0 ? tableStartX : prev + columnWidths[idx - 1]);
      return acc;
    }, []);

    const drawTableHeader = () => {
      const headerY = doc.y;
      const headerHeight = 22;
      doc.rect(tableStartX, headerY, tableWidth, headerHeight).fillAndStroke("#f1f5f9", "#cbd5f5");
      doc.fillColor("#0f172a");
      doc.fontSize(10);
      columns.forEach((col, idx) => {
        const x = columnPositions[idx] + 6;
        doc.text(col.label, x, headerY + 6, { width: columnWidths[idx] - 12, align: "left" });
      });
      doc.strokeColor("#cbd5f5");
      columns.slice(1).forEach((_, idx) => {
        const x = columnPositions[idx + 1];
        doc.moveTo(x, headerY).lineTo(x, headerY + headerHeight).stroke();
      });
      doc.y = headerY + headerHeight;
    };

    const ensureSpaceForRow = (rowHeight: number) => {
      if (doc.y + rowHeight > contentBottom) {
        doc.addPage();
        doc.y = contentTop;
        drawTableHeader();
      }
    };

    drawTableHeader();
    doc.fontSize(9);
    doc.fillColor("#1f2937");

    if (!transactionLog.length) {
      const rowHeight = 22;
      ensureSpaceForRow(rowHeight);
      const rowY = doc.y;
      doc.text("No transactions found for the selected period.", tableStartX + 6, rowY + 6, {
        width: tableWidth - 12,
        align: "left",
      });
      doc.moveTo(tableStartX, rowY).lineTo(tableStartX + tableWidth, rowY).strokeColor("#e2e8f0").stroke();
      doc.y = rowY + rowHeight;
      doc.moveTo(tableStartX, doc.y).lineTo(tableStartX + tableWidth, doc.y).strokeColor("#cbd5f5").stroke();
    } else {
      transactionLog.forEach((item, index) => {
        const rowData = [
          formatDateADBSShort(item.date),
          item.type,
          item.category,
          item.description,
          formatCurrency(item.amount),
        ];
        const cellHeights = rowData.map((text, idx) =>
          doc.heightOfString(text || "-", { width: columnWidths[idx] - 12, align: "left" }),
        );
        const rowHeight = Math.max(18, ...cellHeights) + 8;
        ensureSpaceForRow(rowHeight);
        const rowY = doc.y;

        doc.strokeColor("#e2e8f0");
        doc.moveTo(tableStartX, rowY).lineTo(tableStartX + tableWidth, rowY).stroke();

        rowData.forEach((text, idx) => {
          const x = columnPositions[idx] + 6;
          const width = columnWidths[idx] - 12;
          const align = idx === rowData.length - 1 ? "right" : "left";

if (idx === 0) {
  // ✅ Date column: Nepali month short names render correctly
  writeTextWithFallback(doc, text || "-", { x, y: rowY + 4, width, align: "left" });
  // ✅ Reset font so other columns stay normal latin font
  doc.font(FONT_LATIN_REGULAR);
} else {
  doc.text(text || "-", x, rowY + 4, { width, align });
}

          doc.strokeColor("#e2e8f0");
          doc.moveTo(columnPositions[idx], rowY).lineTo(columnPositions[idx], rowY + rowHeight).stroke();
        });
        doc.moveTo(tableStartX + tableWidth, rowY).lineTo(tableStartX + tableWidth, rowY + rowHeight).stroke();

        doc.y = rowY + rowHeight;

        const isLastRow = index === transactionLog.length - 1;
        if (isLastRow) {
          doc.moveTo(tableStartX, doc.y).lineTo(tableStartX + tableWidth, doc.y).strokeColor("#cbd5f5").stroke();
        }
      });
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      drawHeaderFooter(i + 1, range.count);
    }

    doc.end();
  } catch (err) {
    console.error("getFinancialSummaryPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate financial summary PDF" });
    try {
      res.end();
    } catch {}
  }
};





/* FELLOWSHIP SCHEDULE PDF */

export const getFellowshipSchedulePdf = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Missing schedule id" });

    const schedule =
      (await (prisma as any).generatedscheduleitem?.findUnique?.({ where: { id }, include: { responsibility: true } })) ??
      (await (prisma as any).generatedScheduleItem?.findUnique?.({
        where: { id },
        include: { responsibility: true },
      }));

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const responsibilities = Array.isArray(schedule.responsibility) ? schedule.responsibility : [];
    const responsibilityLines = responsibilities
      .map((resp: any) => `${resp.role}: ${resp.assignedTo}`)
      .filter((line: string) => line.trim());

    const details = [
      schedule.location ? `Location: ${schedule.location}` : null,
      schedule.contactNumber ? `Contact: ${schedule.contactNumber}` : null,
      schedule.additionalNotesOrProgramDetails ? schedule.additionalNotesOrProgramDetails : null,
      ...responsibilityLines,
    ]
      .filter(Boolean)
      .join("\n");

    const timeLabel = schedule.timeSlot ? `${formatDateADBSShort(schedule.scheduledDate)} | ${schedule.timeSlot}` : "";
    
    setPdfHeaders(res, `Fellowship_Schedule_${id}.pdf`);
    const doc = createDoc(res);
    buildFellowshipSchedulePdf(doc, {
      churchName: "Bishram Ekata Mandali",
      items: [
        {
          timeLabel,
          title: schedule.groupNameOrEventTitle || "Schedule",
          speakerName: schedule.postedByAdminName || "",
          details: details || undefined,
        },
      ],
    });
    doc.end();
  } catch (err) {
    console.error("getFellowshipSchedulePdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate fellowship schedule PDF" });
    try {
      res.end();
    } catch {}
  }
};

export const getDonorListPdf = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const { start, end } = normalizeDateRange(
    typeof startDate === "string" ? startDate : undefined,
    typeof endDate === "string" ? endDate : undefined,
  );

  if ((startDate && !start) || (endDate && !end)) {
    return res.status(400).json({ error: "Invalid startDate or endDate." });
  }

  if (start && end && start > end) {
    return res.status(400).json({ error: "startDate must be before endDate." });
  }

  try {
    const [collectionRecords, donationRecords] = await Promise.all([
      prisma.collectionrecord.findMany({
        where: {
          ...(start || end
            ? {
                collectionDate: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        include: {
          donordetail: true,
        },
        orderBy: {
          collectionDate: "asc",
        },
      }),
      prisma.donationrecord.findMany({
        where: {
          ...(start || end
            ? {
                donationDate: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        orderBy: {
          donationDate: "asc",
        },
      }),
    ]);

    const donorsByName = new Map<string, DonorListEntry[]>();
    collectionRecords.forEach((record) => {
      record.donordetail.forEach((donor) => {
        const donationEntry: DonorDonationEntry = {
          amount: Number(donor.amount ?? 0),
          date: record.collectionDate,
          collectionId: record.id,
          purpose: record.purpose,
        };
        addDonorDonation(donorsByName, donor.donorName, donor.address, donor.contact, donationEntry);
      });
    });

    donationRecords.forEach((record) => {
      const donationEntry: DonorDonationEntry = {
        amount: Number(record.amount ?? 0),
        date: record.donationDate,
        collectionId: record.id,
        purpose: record.purpose,
      };
      addDonorDonation(donorsByName, record.donorName, null, record.donorPhone ?? null, donationEntry);
    });

    const donors = Array.from(donorsByName.values())
      .flat()
      .sort((a, b) => b.totalAmount - a.totalAmount);
    const title = "Donors List";
 
     const formatBsHeader = (d?: Date | null): string => {
       if (!d) return "";
       const parts = getBsDateParts(d);
       if (!parts) return formatDateADBSShort(d);
       const monthName = BS_MONTH_NAMES_NP[(parts.month ?? 1) - 1] ?? "";
       const day = String(parts.day).padStart(2, "0");
       return `${monthName} ${day}, ${parts.year}`.trim();
     };
 
     const formatAdHeader = (d?: Date | null): string => {
       if (!d) return "";
       try {
         return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(d);
       } catch {
         return d.toISOString().slice(0, 10);
       }
     };
 
     const headerBsLine = `${start ? formatBsHeader(start) : "Start"} – ${end ? formatBsHeader(end) : "Present"}`;
     const headerAdLine = `(${start ? formatAdHeader(start) : "Start"} – ${end ? formatAdHeader(end) : "Present"})`;

    const refinedDonors = buildRefinedDonorList(donors);
    
    const totalDonors = donors.length;
const totalDonated = donors.reduce(
  (sum, d) => sum + Number(d.totalAmount || 0),
  0
);

    const pdfBuffer = await buildDonorListPdfBuffer(
  {
    title,
    churchName: "Bishram Ekata Mandali",
    headerBsLine,
    headerAdLine,
    totalDonors,
    totalDonated,
  },
  donors,
  refinedDonors,
);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="donors_list.pdf"');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    if (handleDatabaseFallback(req, res, error)) return;
    return res.status(500).json({ error: "Failed to fetch donors list." });
  }
};
