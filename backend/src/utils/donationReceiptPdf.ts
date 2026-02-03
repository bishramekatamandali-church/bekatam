 
import PDFDocument from 'pdfkit';
import { pdfTextMixed, registerPdfFonts } from './pdfFonts';
import { formatDateADBS } from './dateFormatters';

export type DonationReceiptPdfData = {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  purpose: string;
  donationDate: Date;
  transactionReference?: string | null;
};

/**
 * Builds a PDF buffer with embedded fonts so Nepali/Devanagari + English text remains visible after download.
 * Font rule is consistent across app: split mixed-script strings into runs and switch fonts per-run.
 */
export const buildDonationReceiptPdfBuffer = (data: DonationReceiptPdfData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fontRegistry = registerPdfFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const line = (text: string, options?: any) => {
        pdfTextMixed(doc, fontRegistry, text, options);
      };

      // Header
      doc.fontSize(18);
      line('Donation Receipt', { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(11);
      line('Bishram Ekata Mandali', { align: 'center' });
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Body
      doc.fontSize(12);
      line(`Thank you, ${data.donorName}, for your generous support.`);
      doc.moveDown(0.8);

      line(`Transaction ID: ${data.id}`);
      line(`Donor Email: ${data.donorEmail}`);
      if (data.transactionReference) line(`Reference: ${data.transactionReference}`);
      line(`Purpose: ${data.purpose || '—'}`);
      line(`Amount: NPR ${Number(data.amount || 0).toFixed(2)}`);
      line(`Date Logged: ${formatDateADBS(data.donationDate)}`);

      doc.moveDown(1.2);
      doc.fontSize(9);
      line('This receipt is generated electronically and is valid without a signature.');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
 
