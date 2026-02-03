import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../db";
import { formatDateADBS, formatDateADBSShort } from "../utils/dateFormatters";

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


function setPdfHeaders(res: Response, filename: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
}

function createDoc(res: Response) {
  ensureFontExists(FONT_LATIN_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_BOLD);
  if (!fs.existsSync(FONT_EMOJI_REGULAR)) {
    console.warn("Emoji font missing, emoji rendering may be limited:", FONT_EMOJI_REGULAR);
  }

  const doc = new PDFDocument({ size: "A4", margin: 50 });
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
  options: { continued?: boolean; align?: "left" | "center" | "right" | "justify" } = {},
  style: "normal" | "bold" = "normal",
) {
  const value = String(text ?? "");
  if (!value) {
    doc.text("", { continued: options.continued });
    return;
  }

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
    doc.text(segment.text, { ...options, continued: isLast ? options.continued : true });
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

function formatLocalTimestamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

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
