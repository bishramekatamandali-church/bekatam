import { jsPDF } from 'jspdf';

export type PdfFontState = {
  latinFontName: string;
  devanagariFontName: string;
  emojiFontName: string;
  supportsBoldLatin: boolean;
  supportsBoldDevanagari: boolean;
};

const DEVANAGARI_FONT_NAME = 'NotoSansDevanagari';
const LATIN_FONT_NAME = 'NotoSans';
const EMOJI_FONT_NAME = 'NotoEmoji';
const BASE_FALLBACK_FONT = 'Helvetica';

const DEV_REGULAR_FILENAME = 'NotoSansDevanagari-Regular.ttf';
const DEV_BOLD_FILENAME = 'NotoSansDevanagari-Bold.ttf';
const LATIN_REGULAR_FILENAME = 'NotoSans-Regular.ttf';
const LATIN_BOLD_FILENAME = 'NotoSans-Bold.ttf'; // optional (we will fall back to regular if not present)
const EMOJI_REGULAR_FILENAME = 'NotoEmoji-Regular.ttf';

let cachedLoadAttempt = false;
let cachedFonts: Record<string, string | null> = {
  devRegular: null,
  devBold: null,
  latinRegular: null,
  latinBold: null,
  emojiRegular: null,
};

const DEVANAGARI_RE = /[\u0900-\u097F]/;
export const isDevanagariText = (text?: string) => Boolean(text && DEVANAGARI_RE.test(text));
const EMOJI_RE = /\p{Extended_Pictographic}/u;
export const isEmojiText = (text?: string) => Boolean(text && EMOJI_RE.test(text));

const normalizeBase64 = (value?: string): string => (value || '').replace(/\s+/g, '');

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);

const getFontUrl = (filename: string) => {
  const baseUrl = ensureTrailingSlash(import.meta.env.BASE_URL || '/');
  return `${baseUrl}fonts/${filename}`;
};

const loadFontFromUrl = async (url?: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return arrayBufferToBase64(buffer);
  } catch (error) {
    console.warn('Failed to load PDF font from URL:', url, error);
    return null;
  }
};

const loadAllFonts = async (): Promise<typeof cachedFonts> => {
  if (cachedLoadAttempt) return cachedFonts;
  cachedLoadAttempt = true;

  // Optional env overrides (base64 / custom urls)
  const envDevRegular = normalizeBase64(import.meta.env.VITE_DEVANAGARI_FONT_BASE64 as string | undefined);
  const envDevBold = normalizeBase64(import.meta.env.VITE_DEVANAGARI_FONT_BOLD_BASE64 as string | undefined);

  const envLatinRegular = normalizeBase64(import.meta.env.VITE_LATIN_FONT_BASE64 as string | undefined);
  const envLatinBold = normalizeBase64(import.meta.env.VITE_LATIN_FONT_BOLD_BASE64 as string | undefined);

  const envEmojiRegular = normalizeBase64(import.meta.env.VITE_EMOJI_FONT_BASE64 as string | undefined);

  const devRegularUrl = (import.meta.env.VITE_DEVANAGARI_FONT_URL as string | undefined) || getFontUrl(DEV_REGULAR_FILENAME);
  const devBoldUrl = (import.meta.env.VITE_DEVANAGARI_FONT_BOLD_URL as string | undefined) || getFontUrl(DEV_BOLD_FILENAME);

  const latinRegularUrl = (import.meta.env.VITE_LATIN_FONT_URL as string | undefined) || getFontUrl(LATIN_REGULAR_FILENAME);
  const latinBoldUrl = (import.meta.env.VITE_LATIN_FONT_BOLD_URL as string | undefined) || getFontUrl(LATIN_BOLD_FILENAME);
  const emojiRegularUrl = (import.meta.env.VITE_EMOJI_FONT_URL as string | undefined) || getFontUrl(EMOJI_REGULAR_FILENAME);

  cachedFonts.devRegular = envDevRegular || (await loadFontFromUrl(devRegularUrl));
  cachedFonts.devBold = envDevBold || (await loadFontFromUrl(devBoldUrl));
  cachedFonts.latinRegular = envLatinRegular || (await loadFontFromUrl(latinRegularUrl));
  cachedFonts.latinBold = envLatinBold || (await loadFontFromUrl(latinBoldUrl));
  cachedFonts.emojiRegular = envEmojiRegular || (await loadFontFromUrl(emojiRegularUrl));

  return cachedFonts;
};

/**
 * Register both Latin + Devanagari fonts.
 *
 * App-wide font rule (same as backend):
 * - Default to Latin when unsure/empty (so English never becomes blank)
 * - Switch to Devanagari only for runs that contain Devanagari characters
 * - For mixed strings, render by runs (see `pdfTextMixed` / `wrapMixedText`)
 */
export const preparePdfDoc = async (doc: jsPDF): Promise<PdfFontState> => {
  const fonts = await loadAllFonts();

  let latinName = BASE_FALLBACK_FONT;
  let devName = BASE_FALLBACK_FONT;
  let emojiName = BASE_FALLBACK_FONT;

  try {
    if (fonts.latinRegular) {
      doc.addFileToVFS(LATIN_REGULAR_FILENAME, fonts.latinRegular);
      doc.addFont(LATIN_REGULAR_FILENAME, LATIN_FONT_NAME, 'normal');
      latinName = LATIN_FONT_NAME;

      if (fonts.latinBold) {
        doc.addFileToVFS(LATIN_BOLD_FILENAME, fonts.latinBold);
        doc.addFont(LATIN_BOLD_FILENAME, LATIN_FONT_NAME, 'bold');
      }
    }

    if (fonts.devRegular) {
      doc.addFileToVFS(DEV_REGULAR_FILENAME, fonts.devRegular);
      doc.addFont(DEV_REGULAR_FILENAME, DEVANAGARI_FONT_NAME, 'normal');
      devName = DEVANAGARI_FONT_NAME;

      if (fonts.devBold) {
        doc.addFileToVFS(DEV_BOLD_FILENAME, fonts.devBold);
        doc.addFont(DEV_BOLD_FILENAME, DEVANAGARI_FONT_NAME, 'bold');
      }
    }

    if (fonts.emojiRegular) {
      doc.addFileToVFS(EMOJI_REGULAR_FILENAME, fonts.emojiRegular);
      doc.addFont(EMOJI_REGULAR_FILENAME, EMOJI_FONT_NAME, 'normal');
      emojiName = EMOJI_FONT_NAME;
    }
  } catch (error) {
    console.warn('Failed to register PDF fonts:', error);
  }

  // Default = latin (important!)
  doc.setFont(latinName, 'normal');

  return {
    latinFontName: latinName,
    devanagariFontName: devName,
    emojiFontName: emojiName,
    supportsBoldLatin: Boolean(fonts.latinBold),
    supportsBoldDevanagari: Boolean(fonts.devBold),
  };
};


/**
 * Legacy helper kept for older pages:
 * - Defaults to Latin
 * - If `textSample` contains Devanagari, switches to Devanagari
 */
export const setPdfFont = (
  doc: jsPDF,
  state: PdfFontState,
  style: 'normal' | 'bold' = 'normal',
  textSample: string = '',
) => {
  setPdfFontForText(doc, state, textSample, style);
};

export const setPdfFontForText = (
  doc: jsPDF,
  state: PdfFontState,
  textSample: string,
  style: 'normal' | 'bold' = 'normal',
) => {
  if (isEmojiText(textSample)) {
    doc.setFont(state.emojiFontName, 'normal');
    return;
  }

  const wantsDev = isDevanagariText(textSample);
  const fontName = wantsDev ? state.devanagariFontName : state.latinFontName;

  // If bold isn't available for the chosen family, fall back to normal.
  const canBold = wantsDev ? state.supportsBoldDevanagari : state.supportsBoldLatin;
  const resolvedStyle = style === 'bold' && !canBold ? 'normal' : style;

  doc.setFont(fontName, resolvedStyle);
};

type TextRun = { text: string; script: 'devanagari' | 'latin' | 'emoji' };

export const splitTextRuns = (value: string): TextRun[] => {
  const text = String(value ?? '');
  if (!text) return [];
  const runs: TextRun[] = [];

  let current = '';
  let currentScript: TextRun['script'] = isEmojiText(text[0])
    ? 'emoji'
    : isDevanagariText(text[0])
      ? 'devanagari'
      : 'latin';

  for (const ch of text) {
    const script: TextRun['script'] = isEmojiText(ch)
      ? 'emoji'
      : isDevanagariText(ch)
        ? 'devanagari'
        : 'latin';
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

export const getMixedTextWidth = (doc: jsPDF, state: PdfFontState, text: string, style: 'normal' | 'bold' = 'normal') => {
  const runs = splitTextRuns(text);
  let total = 0;
  for (const run of runs) {
    const sample = run.script === 'emoji' ? '🙂' : run.script === 'devanagari' ? 'अ' : 'A';
    setPdfFontForText(doc, state, sample, style);
    total += doc.getTextWidth(run.text);
  }
  return total;
};

export const pdfTextMixed = (
  doc: jsPDF,
  state: PdfFontState,
  text: string,
  x: number,
  y: number,
  options?: { align?: 'left' | 'center' | 'right' },
  style: 'normal' | 'bold' = 'normal',
) => {
  const runs = splitTextRuns(text);
  const align = options?.align ?? 'left';

  let startX = x;
  if (align !== 'left') {
    const width = getMixedTextWidth(doc, state, text, style);
    if (align === 'center') startX = x - width / 2;
    if (align === 'right') startX = x - width;
  }

  let cursorX = startX;
  for (const run of runs) {
    const sample = run.script === 'emoji' ? '🙂' : run.script === 'devanagari' ? 'अ' : 'A';
    setPdfFontForText(doc, state, sample, style);
    doc.text(run.text, cursorX, y);
    cursorX += doc.getTextWidth(run.text);
  }
};

/**
 * Basic word-wrapping for mixed-script strings.
 * Returns plain string lines; each line will be rendered via `pdfTextMixed`.
 */
export const wrapMixedText = (doc: jsPDF, state: PdfFontState, text: string, maxWidth: number, style: 'normal' | 'bold' = 'normal') => {
  const raw = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];

  const words = raw.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const w = getMixedTextWidth(doc, state, next, style);
    if (w <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};
  
 
