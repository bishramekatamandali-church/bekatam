import PDFDocument from "pdfkit";
import { applyPdfFont } from "./pdfFonts";

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
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" });
  } catch {
    return d.toISOString().split("T")[0];
  }
};

export const buildDonationReceiptPdfBuffer = (data: DonationReceiptPdfData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      applyPdfFont(doc);
      const chunks: Buffer[] = [];

      doc.on("data", (c: Buffer) => {
        chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
      });
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (e: Error) => reject(e));

      doc.fontSize(18).text("Donation Receipt", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(11).text("Bishram Ekata Mandali", { align: "center" });
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(12).text(`Thank you, ${data.donorName}, for your generous support.`);
      doc.moveDown(0.8);

      doc.fontSize(12).text(`Transaction ID: ${data.id}`);
      doc.text(`Donor Email: ${data.donorEmail}`);
      doc.text(`Amount: NPR ${Number(data.amount || 0).toFixed(2)}`);
      doc.text(`Purpose: ${data.purpose}`);
      doc.text(`Date Logged: ${formatDate(data.donationDate)}`);
      if (data.transactionReference) {
        doc.text(`Transaction Reference: ${data.transactionReference}`);
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);

      doc.fontSize(9).fillColor("#444444").text(
        "Note: Please ensure you have completed the actual transfer via your chosen method. This system is for record-keeping purposes.",
        { align: "left" }
      );
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor("#444444").text(
        "The fund will be used as purposed by the donor; however, the final authority to manage all funds remains under the high authority of the church.",
        { align: "left" }
      );

      doc.end();
    } catch (e) {
      reject(e as Error);
    }
  });
};
