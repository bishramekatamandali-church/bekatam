import PDFDocument from "pdfkit";
import { applyPdfFont, registerPdfFonts } from "./pdfFonts";

export type DonationReceiptPdfData = {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  purpose: string;
  donationDate: Date;
  transactionReference?: string | null;
};

const formatDate = (d: Date) => {
  try {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  } catch {
    return d.toISOString().split("T")[0];
  }
};

/**
 * Builds a PDF buffer with embedded fonts so Nepali/Devanagari text remains visible after download.
 */
export const buildDonationReceiptPdfBuffer = (
  data: DonationReceiptPdfData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const fontRegistry = registerPdfFonts(doc);

      // Ensure we have a safe default font before any text render.
      // (This prevents PDFKit from throwing if the first text call happens before a font is set.)
      applyPdfFont(doc, fontRegistry, "A");

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const textLine = (
        text: string,
        options?: Record<string, unknown>,
        fontSize?: number
      ) => {
        applyPdfFont(doc, fontRegistry, text);
        if (typeof fontSize === "number") doc.fontSize(fontSize);
        doc.text(text, options as any);
      };

      // Header
      textLine("Donation Receipt", { align: "center" }, 18);
      doc.moveDown(0.3);

      textLine("Bishram Ekata Mandali", { align: "center" }, 11);
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Body
      textLine(`Thank you, ${data.donorName}, for your generous support.`, undefined, 12);
      doc.moveDown(0.8);

      textLine(`Transaction ID: ${data.id}`);
      textLine(`Donor Email: ${data.donorEmail}`);
      if (data.transactionReference) {
        textLine(`Reference: ${data.transactionReference}`);
      }
      textLine(`Purpose: ${data.purpose || "—"}`);
      textLine(`Amount: NPR ${Number(data.amount || 0).toFixed(2)}`);
      textLine(`Date Logged: ${formatDate(data.donationDate)}`);

      doc.moveDown(1.2);

      textLine(
        "This receipt is generated electronically and is valid without a signature.",
        undefined,
        9
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
