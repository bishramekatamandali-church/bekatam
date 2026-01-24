import PDFDocument from "pdfkit";

type ReceiptData = {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string | null;
  amount: number;
  purpose: string;
  donationDate: string | Date;
  receiptVerses?: string | null;
  churchName?: string;
};

function safeDateString(value: string | Date): string {
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return String(value);
  }
}

function pickRandomVerse(receiptVerses?: string | null): string | null {
  if (!receiptVerses) return null;
  const lines = receiptVerses
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}

export function buildDonationReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (e) => reject(e));

      const churchName = data.churchName || "Bishram Ekata Mandali (BEM)";
      const verse = pickRandomVerse(data.receiptVerses);

      // Header
      doc.fontSize(18).text("Donation Receipt", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(12).text(churchName, { align: "center" });
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Success/thanks line
      doc.fontSize(13).text(`Thank you, ${data.donorName}!`, { align: "left" });
      doc.moveDown(0.8);

      // Receipt details (match what you show in print/download)
      doc.fontSize(11);

      const rows: Array<[string, string]> = [
        ["Transaction ID", data.id],
        ["Donor Name", data.donorName],
        ["Donor Email", data.donorEmail],
        ["Donor Phone", data.donorPhone ? String(data.donorPhone) : "-"],
        ["Amount Logged (NPR)", Number(data.amount || 0).toFixed(2)],
        ["Purpose", data.purpose],
        ["Date Logged", safeDateString(data.donationDate)],
      ];

      const labelWidth = 160;
      rows.forEach(([label, value]) => {
        doc.font("Helvetica-Bold").text(label + ":", { continued: true, width: labelWidth });
        doc.font("Helvetica").text(" " + value);
        doc.moveDown(0.2);
      });

      doc.moveDown(0.8);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      if (verse) {
        doc.font("Helvetica-Oblique")
          .fontSize(11)
          .text(verse, {
            align: "center",
          });
        doc.moveDown(1);
      }

      doc.font("Helvetica")
        .fontSize(9)
        .fillColor("#444444")
        .text(
          "Please ensure you have completed the actual transfer via your chosen method. This system is for record-keeping purposes.",
          { align: "center" }
        );
      doc.moveDown(0.3);
      doc.text(
        "The fund will be used as purposed by the donor; however, the final authority to manage all funds remains under the high authority of the church.",
        { align: "center" }
      );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
