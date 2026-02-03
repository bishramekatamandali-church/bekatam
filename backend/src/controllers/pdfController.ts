import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../db";
import { BS_MONTH_NAMES_NP, formatDateADBS, formatDateADBSShort, getBsDateParts } from "../utils/dateFormatters";
import { buildFellowshipSchedulePdf } from "../services/pdf/buildFellowshipSchedulePdf";

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

const formatCurrency = (amount: number) => `NPR ${Number(amount ?? 0).toFixed(2)}`;

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
    writeLine(doc, "Active Member: ", member.isActiveMember ? "Yes" : "No");
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
    const doc = createDoc(res);

    doc.fontSize(18);
    writeTextWithFallback(doc, "Financial Summary Report", { continued: false, align: "center" }, "bold");
    doc.moveDown(0.5);

    doc.fontSize(11);
    const rangeLabel = `Date Range: ${startDate?.toISOString().slice(0, 10) || "Start"} to ${
      endDate?.toISOString().slice(0, 10) || "End"
    }`;
    writeTextWithFallback(doc, rangeLabel, { continued: false, align: "center" });
    doc.moveDown(0.8);

    writeLine(doc, "Total Income: ", formatCurrency(totalIncome));
    writeLine(doc, "Total Expense: ", formatCurrency(totalExpense));
    writeLine(doc, "Net Balance: ", formatCurrency(totalIncome - totalExpense));
    doc.moveDown(0.8);

    doc.fontSize(12);
    writeTextWithFallback(doc, "Transactions:", { continued: false }, "bold");
    doc.moveDown(0.4);

    doc.fontSize(10);
    if (!transactionLog.length) {
      writeTextWithFallback(doc, "No transactions found for the selected period.", { continued: false });
    } else {
      transactionLog.forEach((item) => {
        const line = `${formatDateADBSShort(item.date)} | ${item.type} | ${item.category} | ${item.description} | ${formatCurrency(
          item.amount
        )}`;
        writeTextWithFallback(doc, line, { continued: false });
      });
    }

    doc.moveDown(0.6);
    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getFinancialSummaryPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate financial summary PDF" });
    try {
      res.end();
    } catch {}
  }
};

export const getCalendarPdf = async (req: Request, res: Response) => {
  try {
    const bsYearRaw = String(req.query.bsYear || req.query.year || "").trim();
    const bsYear = Number(bsYearRaw);
    if (!bsYear || Number.isNaN(bsYear)) {
      return res.status(400).json({ message: "Missing bsYear" });
    }

    const [events, newsItems, sermons, blogPosts, rosterItems, generatedSchedules] = await Promise.all([
      (prisma as any).event?.findMany?.({ where: { date: { not: null } } }) ?? [],
      (prisma as any).newsitem?.findMany?.({ where: { date: { not: null } } }) ??
        (await (prisma as any).newsItem?.findMany?.({ where: { date: { not: null } } })),
      (prisma as any).sermon?.findMany?.({ where: { date: { not: null } } }) ?? [],
      (prisma as any).blogpost?.findMany?.({ where: { date: { not: null } } }) ??
        (await (prisma as any).blogPost?.findMany?.({ where: { date: { not: null } } })),
      (prisma as any).fellowshiprosteritem?.findMany?.({ where: { assignedDate: { not: null } } }) ?? [],
      (prisma as any).generatedscheduleitem?.findMany?.({ where: { scheduledDate: { not: null } } }) ?? [],
    ]);

    type CalendarEntry = { month: number; day: number; title: string; type: string; time?: string; date: string };
    const entriesByMonth = new Map<number, CalendarEntry[]>();

    const pushEntry = (dateValue: any, title: string, type: string, time?: string) => {
      if (!dateValue) return;
      const bs = getBsDateParts(dateValue);
      if (!bs || bs.year !== bsYear) return;
      const entry: CalendarEntry = {
        month: bs.month,
        day: bs.day,
        title,
        type,
        time,
        date: new Date(dateValue).toISOString(),
      };
      const list = entriesByMonth.get(bs.month) ?? [];
      list.push(entry);
      entriesByMonth.set(bs.month, list);
    };

    (events || []).forEach((item: any) => pushEntry(item.date, item.title || "Event", "Event", item.time));
    (newsItems || []).forEach((item: any) => pushEntry(item.date, item.title || "News", "News"));
    (sermons || []).forEach((item: any) => pushEntry(item.date, item.title || "Sermon", "Sermon", item.time));
    (blogPosts || []).forEach((item: any) => pushEntry(item.date, item.title || "Blog", "Blog"));
    (rosterItems || []).forEach((item: any) =>
      pushEntry(item.assignedDate, item.groupNameOrEventTitle || "Notice", "Roster", item.timeSlot)
    );
    (generatedSchedules || []).forEach((item: any) =>
      pushEntry(item.scheduledDate, item.groupNameOrEventTitle || "Notice", "Schedule", item.timeSlot)
    );

    setPdfHeaders(res, `BEM_Calendar_${bsYear}_BS.pdf`);
    const doc = createDoc(res);

    doc.fontSize(18);
    writeTextWithFallback(doc, "Bishram Ekata Mandali", { continued: false, align: "center" }, "bold");
    doc.fontSize(14);
    writeTextWithFallback(doc, `Event Calendar (${bsYear} BS)`, { continued: false, align: "center" }, "bold");
    doc.moveDown(1);

    for (let month = 1; month <= 12; month += 1) {
      const monthEntries = entriesByMonth.get(month);
      if (!monthEntries || monthEntries.length === 0) continue;

      monthEntries.sort((a, b) => a.day - b.day);
      doc.fontSize(13);
      writeTextWithFallback(doc, `${BS_MONTH_NAMES_NP[month - 1]} ${bsYear} BS`, { continued: false }, "bold");
      doc.moveDown(0.4);

      doc.fontSize(10);
      monthEntries.forEach((entry) => {
        const timeLabel = entry.time ? ` @ ${entry.time}` : "";
        const line = `${entry.day}. ${entry.title} (${entry.type}${timeLabel}) - ${formatDateADBS(entry.date)}`;
        writeTextWithFallback(doc, line, { continued: false });
      });

      doc.moveDown(0.6);
    }

    if (entriesByMonth.size === 0) {
      doc.fontSize(11);
      writeTextWithFallback(doc, "No events or notices found for the selected year.", { continued: false });
    }

    doc.fontSize(9);
    writeTextWithFallback(doc, `Generated at: ${formatLocalTimestamp()}`);
    doc.end();
  } catch (err) {
    console.error("getCalendarPdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate calendar PDF" });
    try {
      res.end();
    } catch {}
  }
};

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

    const doc = buildFellowshipSchedulePdf({
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

    setPdfHeaders(res, `Fellowship_Schedule_${id}.pdf`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("getFellowshipSchedulePdf error:", err);
    if (!res.headersSent) return res.status(500).json({ message: "Failed to generate fellowship schedule PDF" });
    try {
      res.end();
    } catch {}
  }
};
