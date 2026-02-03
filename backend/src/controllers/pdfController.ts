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


function ensureFontExists(p: string) {
  if (!fs.existsSync(p)) throw new Error(`Font file missing: ${p}`);
}

function hasDevanagari(text: string) {
  return /[\u0900-\u097F]/.test(String(text || ""));
}


function setPdfHeaders(res: Response, filename: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
}

function createDoc(res: Response) {
  ensureFontExists(FONT_LATIN_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_REGULAR);
  ensureFontExists(FONT_DEVANAGARI_BOLD);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);
  doc.font(FONT_LATIN_REGULAR);
  return doc;
}

function setFontForText(doc: any, text: string, style: "normal" | "bold" = "normal") {
  const t = String(text || "");
  if (hasDevanagari(t)) {
    doc.font(style === "bold" ? FONT_DEVANAGARI_BOLD : FONT_DEVANAGARI_REGULAR);
  } else {
    doc.font(FONT_LATIN_REGULAR);
  }
}

function writeLine(doc: any, label: string, value: any) {
  const l = label === null || label === undefined ? "" : String(label);
  const v = value === null || value === undefined ? "" : String(value);

  setFontForText(doc, l, "normal");
  doc.fontSize(11).text(l, { continued: true });

  setFontForText(doc, v, "normal");
  doc.text(v || "");
}

function writeBlock(doc: any, title: string, body: any) {
  const t = String(title || "");
  const b = body === null || body === undefined ? "" : String(body);

  setFontForText(doc, t, "bold");
  doc.fontSize(12).text(t);

  setFontForText(doc, b, "normal");
  doc.fontSize(10).text(b);

  doc.moveDown(0.5);
}

export const getTestPdf = async (_req: Request, res: Response) => {
  try {
    setPdfHeaders(res, "pdf-font-test.pdf");
    const doc = createDoc(res);

    setFontForText(doc, "BEM PDF Test", "bold");
    doc.fontSize(18).text("BEM PDF Test", { align: "center" });
    doc.moveDown(1);

    writeLine(doc, "English: ", "Hello World");
    doc.moveDown(0.3);
    writeLine(doc, "Nepali: ", "नमस्ते संसार");
    doc.moveDown(0.3);

    doc.font(FONT_LATIN_REGULAR).fontSize(9).text(`Generated at: ${new Date().toISOString()}`);
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

    setFontForText(doc, "Bishram Ekata Mandali", "bold");
    doc.fontSize(18).text("Bishram Ekata Mandali", { align: "center" });
    doc.fontSize(14).text("Meeting Log", { align: "center" });
    doc.moveDown(1);

    writeLine(doc, "Title: ", meeting.title || "");
    writeLine(doc, "Date: ", formatDateADBSShort(meeting.meetingDate));
    writeLine(doc, "Type: ", meeting.meetingType || "");
    writeLine(doc, "Status: ", meeting.status || "");
    doc.moveDown(0.5);

    if (meeting.attendees) writeBlock(doc, "Attendees:", meeting.attendees);
    if (meeting.agenda) writeBlock(doc, "Agenda:", meeting.agenda);
    if (meeting.minutes) writeBlock(doc, "Minutes:", meeting.minutes);

    doc.font(FONT_LATIN_REGULAR).fontSize(9).text(`Generated at: ${new Date().toISOString()}`);
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

    setFontForText(doc, "Bishram Ekata Mandali", "bold");
    doc.fontSize(18).text("Bishram Ekata Mandali", { align: "center" });
    doc.fontSize(14).text("Decision Record", { align: "center" });
    doc.moveDown(1);

    writeLine(doc, "Title: ", decision.title || "");
    writeLine(doc, "Date: ", formatDateADBSShort(decision.decisionDate));
    writeLine(doc, "Made By: ", decision.madeBy || "");
    writeLine(doc, "Status: ", decision.status || "");
    doc.moveDown(0.5);

    if (decision.description) writeBlock(doc, "Description:", decision.description);

    doc.font(FONT_LATIN_REGULAR).fontSize(9).text(`Generated at: ${new Date().toISOString()}`);
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

    setFontForText(doc, "Bishram Ekata Mandali", "bold");
    doc.fontSize(18).text("Bishram Ekata Mandali", { align: "center" });
    doc.fontSize(14).text("Collection Record", { align: "center" });
    doc.moveDown(1);

    writeLine(doc, "Purpose: ", record.purpose || "");
    writeLine(doc, "Date: ", formatDateADBSShort(record.collectionDate));
    writeLine(doc, "Collector: ", record.collectorName || "");
    writeLine(doc, "Amount: NPR ", Number(record.amount ?? 0).toFixed(2));
    writeLine(doc, "Deposited: ", record.isDeposited ? "Yes" : "No");
    doc.moveDown(0.5);

    const donors = Array.isArray(record.donordetail) ? record.donordetail : [];
    if (donors.length) {
      setFontForText(doc, "Donors:", "bold");
      doc.fontSize(12).text("Donors:");
      doc.moveDown(0.2);

      donors.forEach((d: any, idx: number) => {
        const name = d.donorName || "";
        const amount = Number(d.amount ?? 0).toFixed(2);
        const contact = d.contact ? ` (${d.contact})` : "";
        const line = `${idx + 1}. ${name} - NPR ${amount}${contact}`;
        setFontForText(doc, line, "normal");
        doc.fontSize(10).text(line);
      });

      doc.moveDown(0.4);
    }

    doc.font(FONT_LATIN_REGULAR).fontSize(9).text(`Generated at: ${new Date().toISOString()}`);
    doc.end();
  } catch (err) {
    console.error("getCollectionRecordPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate collection record PDF" });
    try {
      res.end();
    } catch {}
  }
};
