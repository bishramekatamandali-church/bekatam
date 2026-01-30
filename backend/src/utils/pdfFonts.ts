import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const DEVANAGARI_FONT_NAME = 'NotoSansDevanagari';
const LATIN_FONT_NAME = 'NotoSans';
const DEFAULT_FONT_NAME = 'Helvetica';

const DEVANAGARI_FILENAME = 'NotoSansDevanagari-Regular.ttf';
const LATIN_FILENAME = 'NotoSans-Regular.ttf';

// When compiling to /dist, __dirname changes. We keep a few resilient search locations.
const repoRelativeFontPath = (filename: string) =>
  path.resolve(__dirname, '..', '..', 'assets', 'fonts', filename);

// Common Linux locations (useful when you install `fonts-noto` on the server).
const systemFontCandidates = (filename: string) => [
  `/usr/share/fonts/truetype/noto/${filename}`,
  `/usr/share/fonts/truetype/noto/${filename.replace('.ttf', '')}/${filename}`,
  `/usr/share/fonts/truetype/${filename}`,
];

type PdfFontDocument = PDFDocument & {
  registerFont(name: string, src: string | Buffer): PDFDocument;
  font(name: string): PDFDocument;
};

const firstExistingPath = (candidates: string[]) => candidates.find((p) => p && fs.existsSync(p)) ?? null;

const resolveFontPath = (kind: 'devanagari' | 'latin') => {
  if (kind === 'devanagari') {
    const envPath = process.env.PDF_DEVANAGARI_FONT_PATH;
    if (envPath && fs.existsSync(envPath)) return envPath;
    const repoRootPath = path.resolve(process.cwd(), 'backend', 'assets', 'fonts', DEVANAGARI_FILENAME);
    return (
      firstExistingPath([repoRootPath, repoRelativeFontPath(DEVANAGARI_FILENAME), ...systemFontCandidates(DEVANAGARI_FILENAME)]) ??
      null
    );
  }

  const envPath = process.env.PDF_LATIN_FONT_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const repoRootPath = path.resolve(process.cwd(), 'backend', 'assets', 'fonts', LATIN_FILENAME);
  return (
    firstExistingPath([repoRootPath, repoRelativeFontPath(LATIN_FILENAME), ...systemFontCandidates(LATIN_FILENAME)]) ??
    null
  );
};

const loadFontFromEnv = (envVar: string): Buffer | null => {
  const base64 = process.env[envVar];
  if (!base64) return null;
  try {
    return Buffer.from(base64, 'base64');
  } catch (error) {
    console.warn(`PDF: Invalid base64 in ${envVar}.`, error);
    return null;
  }
};

export type PdfFontRegistry = {
  devanagari: string;
  latin: string;
  defaultFont: string;
};

/**
 * Register fonts so Nepali / Devanagari text renders correctly *inside the downloaded PDF*.
 * If you bundle fonts in the repo: backend/assets/fonts/*.ttf
 * Or install system fonts (recommended on VPS): `apt-get install -y fonts-noto fonts-noto-core`
 */
export const registerPdfFonts = (doc: PDFDocument): PdfFontRegistry => {
  const pdfDoc = doc as PdfFontDocument;

  let devanagari = DEFAULT_FONT_NAME;
  let latin = DEFAULT_FONT_NAME;

  try {
    const devBuffer = loadFontFromEnv('PDF_DEVANAGARI_FONT_BASE64');
    const latinBuffer = loadFontFromEnv('PDF_LATIN_FONT_BASE64');

    const devPath = devBuffer ? null : resolveFontPath('devanagari');
    const latinPath = latinBuffer ? null : resolveFontPath('latin');

    if (devBuffer || devPath) {
      pdfDoc.registerFont(DEVANAGARI_FONT_NAME, devBuffer ?? (devPath as string));
      devanagari = DEVANAGARI_FONT_NAME;
    }

    if (latinBuffer || latinPath) {
      pdfDoc.registerFont(LATIN_FONT_NAME, latinBuffer ?? (latinPath as string));
      latin = LATIN_FONT_NAME;
    }
  } catch (error) {
    console.warn('PDF: Failed to register custom fonts.', error);
  }

  return { devanagari, latin, defaultFont: DEFAULT_FONT_NAME };
};

const DEVANAGARI_RE = /[\u0900-\u097F]/;

/**
 * Use a simple script detection to switch fonts.
 * (PDFKit does not automatically fallback across fonts.)
 */
export const applyPdfFont = (doc: PDFDocument, registry?: PdfFontRegistry, textSample?: string): string => {
  const pdfDoc = doc as PdfFontDocument;
  const fonts = registry ?? registerPdfFonts(doc);

  const target =
    textSample && !DEVANAGARI_RE.test(textSample)
      ? (fonts.latin || fonts.defaultFont)
      : (fonts.devanagari || fonts.defaultFont);

  try {
    pdfDoc.font(target);
    return target;
  } catch {
    pdfDoc.font(DEFAULT_FONT_NAME);
    return DEFAULT_FONT_NAME;
  }
}; 
