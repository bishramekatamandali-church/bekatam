import fs from "fs";
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
 * Register fonts so Nepali / Devanagari + English text renders correctly *inside the downloaded PDF*.
 *
 * Font rule used across the app:
 * - Default to LATIN for unknown/empty text (so English never becomes blank)
 * - Switch to DEVANAGARI only for runs that contain Devanagari characters
 * - For mixed-script strings, render as multiple continued text chunks (PDFKit supports this)
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

export const isDevanagariText = (text?: string): boolean => Boolean(text && DEVANAGARI_RE.test(text));

/**
 * Set a single font based on a sample.
 * IMPORTANT: defaults to LATIN when sample is empty/unknown.
 */
export const applyPdfFont = (doc: PDFDocument, registry?: PdfFontRegistry, textSample?: string): string => {
  const pdfDoc = doc as PdfFontDocument;
  const fonts = registry ?? registerPdfFonts(doc);

  const wantsDevanagari = isDevanagariText(textSample);
  const target = wantsDevanagari ? (fonts.devanagari || fonts.defaultFont) : (fonts.latin || fonts.defaultFont);

  try {
    pdfDoc.font(target);
    return target;
  } catch {
    pdfDoc.font(DEFAULT_FONT_NAME);
    return DEFAULT_FONT_NAME;
  }
};

type TextRun = { text: string; script: 'devanagari' | 'latin' };

export const splitTextRuns = (value: string): TextRun[] => {
  const text = String(value ?? '');
  if (!text) return [];
  const runs: TextRun[] = [];

  let current = '';
  let currentScript: TextRun['script'] = isDevanagariText(text[0]) ? 'devanagari' : 'latin';

  for (const ch of text) {
    const script: TextRun['script'] = isDevanagariText(ch) ? 'devanagari' : 'latin';
    if (script === currentScript) {
      current += ch;
    } else {
      runs.push({ text: current, script: currentScript });
      current = ch;
      currentScript = script;
    }
  }
  if (current) runs.push({ text: current, script: currentScript });
  return runs;
};

/**
 * Write mixed-script text in a stable way:
 * - splits the string into Devanagari vs Latin runs
 * - switches font per run
 * - uses PDFKit `continued` to keep it on the same line / paragraph
 *
 * NOTE: Keep `options` like width/align as you normally pass to doc.text().
 * PDFKit will still wrap as needed.
 */
export const pdfTextMixed = (
  doc: PDFDocument,
  registry: PdfFontRegistry,
  text: string,
  options?: any
): void => {
  const runs = splitTextRuns(text);
  if (runs.length === 0) {
    applyPdfFont(doc, registry, '');
    doc.text('', options as any);
    return;
  }

  runs.forEach((run, idx) => {
    const isLast = idx === runs.length - 1;
    applyPdfFont(doc, registry, run.script === 'devanagari' ? 'अ' : 'A');
    doc.text(run.text, { ...(options as any), continued: !isLast });
  });}; 
