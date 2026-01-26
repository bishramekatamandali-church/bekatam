import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const DEVANAGARI_FONT_NAME = 'NotoSansDevanagari';
const DEFAULT_FONT_NAME = 'Helvetica';
const DEVANAGARI_FONT_PATH = path.resolve(process.cwd(), 'backend', 'assets', 'fonts', 'NotoSansDevanagari-Regular.ttf');
type PdfFontDocument = PDFDocument & {
  registerFont(name: string, src: string | Buffer): PDFDocument;
  font(name: string): PDFDocument;
};

const loadFontFromEnv = (): Buffer | null => {
  const base64 = process.env.PDF_DEVANAGARI_FONT_BASE64;
  if (!base64) return null;
  try {
    return Buffer.from(base64, 'base64');
  } catch (error) {
    console.warn('PDF: Invalid base64 in PDF_DEVANAGARI_FONT_BASE64.', error);
    return null;
  }
};

export const applyPdfFont = (doc: PDFDocument): string => {
  const pdfDoc = doc as PdfFontDocument;
  try {
    const buffer = loadFontFromEnv();
    if (buffer) {
      pdfDoc.registerFont(DEVANAGARI_FONT_NAME, buffer);
      pdfDoc.font(DEVANAGARI_FONT_NAME);
      return DEVANAGARI_FONT_NAME;
    }

    if (fs.existsSync(DEVANAGARI_FONT_PATH)) {
      pdfDoc.registerFont(DEVANAGARI_FONT_NAME, DEVANAGARI_FONT_PATH);
      pdfDoc.font(DEVANAGARI_FONT_NAME);
      return DEVANAGARI_FONT_NAME;
    }
  } catch (error) {
    console.warn('PDF: Failed to register Devanagari font.', error);
  }

  pdfDoc.font(DEFAULT_FONT_NAME);
  return DEFAULT_FONT_NAME;
};
