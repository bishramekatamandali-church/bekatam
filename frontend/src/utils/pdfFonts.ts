import { jsPDF } from 'jspdf';

type PdfFontState = {
  fontName: string;
  supportsBold: boolean;
  supportsItalic: boolean;
};

const DEVANAGARI_FONT_NAME = 'NotoSansDevanagari';
const BASE_FONT_NAME = 'Helvetica';
const DEFAULT_FONT_REGULAR_FILENAME = 'NotoSansDevanagari-Regular.ttf';
const DEFAULT_FONT_BOLD_FILENAME = 'NotoSansDevanagari-Bold.ttf';

let cachedRegularFont: string | null = null;
let cachedBoldFont: string | null = null;
let cachedLoadAttempt = false;

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

const getDefaultFontUrl = (filename: string) => {
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

const loadDevanagariFonts = async (): Promise<{ regular?: string; bold?: string }> => {
  if (cachedLoadAttempt) {
    return { regular: cachedRegularFont ?? undefined, bold: cachedBoldFont ?? undefined };
  }

  cachedLoadAttempt = true;
  const envRegular = normalizeBase64(import.meta.env.VITE_DEVANAGARI_FONT_BASE64 as string | undefined);
  const envBold = normalizeBase64(import.meta.env.VITE_DEVANAGARI_FONT_BOLD_BASE64 as string | undefined);
  const urlRegular = (import.meta.env.VITE_DEVANAGARI_FONT_URL as string | undefined) || getDefaultFontUrl(DEFAULT_FONT_REGULAR_FILENAME);
  const urlBold = (import.meta.env.VITE_DEVANAGARI_FONT_BOLD_URL as string | undefined) || getDefaultFontUrl(DEFAULT_FONT_BOLD_FILENAME);

  cachedRegularFont = envRegular || (await loadFontFromUrl(urlRegular));
  cachedBoldFont = envBold || (await loadFontFromUrl(urlBold));

  return { regular: cachedRegularFont ?? undefined, bold: cachedBoldFont ?? undefined };
};

export const preparePdfDoc = async (doc: jsPDF): Promise<PdfFontState> => {
  try {
    const { regular, bold } = await loadDevanagariFonts();
    if (regular) {
      doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', regular);
      doc.addFont('NotoSansDevanagari-Regular.ttf', DEVANAGARI_FONT_NAME, 'normal');
      if (bold) {
        doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', bold);
        doc.addFont('NotoSansDevanagari-Bold.ttf', DEVANAGARI_FONT_NAME, 'bold');
      }
      doc.setFont(DEVANAGARI_FONT_NAME, 'normal');
      return {
        fontName: DEVANAGARI_FONT_NAME,
        supportsBold: Boolean(bold),
        supportsItalic: false,
      };
    }
  } catch (error) {
    console.warn('Failed to register Devanagari PDF fonts:', error);
  }

  doc.setFont(BASE_FONT_NAME, 'normal');
  return {
    fontName: BASE_FONT_NAME,
    supportsBold: true,
    supportsItalic: true,
  };
};

export const setPdfFont = (doc: jsPDF, state: PdfFontState, style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal') => {
  let resolvedStyle = style;
  if ((style === 'bold' || style === 'bolditalic') && !state.supportsBold) {
    resolvedStyle = 'normal';
  }
  if ((style === 'italic' || style === 'bolditalic') && !state.supportsItalic) {
    resolvedStyle = state.supportsBold && style === 'bolditalic' ? 'bold' : 'normal';
  }
  doc.setFont(state.fontName, resolvedStyle);
};
