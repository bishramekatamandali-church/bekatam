import PDFDocument from "pdfkit";
import { splitRunsByScript, fontPaths } from "./fonts";
type PdfDoc = InstanceType<typeof PDFDocument>;

type Style = "normal" | "bold";

export const setFontForRun = (doc: PdfDoc, runScript: "dev" | "latin", style: Style) => {
  const fp = fontPaths();
  if (runScript === "dev") {
    doc.font(style === "bold" ? fp.devBold : fp.devRegular);
  } else {
    doc.font(style === "bold" ? fp.latinBold : fp.latinRegular);
  }
};

// Draw mixed-script text in a single line with correct fonts
export const drawMixedTextLine = (
  doc: PdfDoc,
  text: string,
  x: number,
  y: number,
  style: Style = "normal"
) => {
  const runs = splitRunsByScript(text);
  let xx = x;

  for (const run of runs) {
    setFontForRun(doc, run.script, style);
    doc.text(run.text, xx, y, { lineBreak: false });
    xx += doc.widthOfString(run.text);
  }
};

// Wrap mixed text into lines by words (simple + stable)
export const wrapMixedText = (doc: PdfDoc, text: string, maxWidth: number, style: Style) => {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const next = line ? `${line} ${w}` : w;

    // measure next with mixed runs
    const width = measureMixed(doc, next, style);

    if (width <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
};

export const measureMixed = (doc: PdfDoc, text: string, style: Style) => {
  const runs = splitRunsByScript(text);
  let w = 0;
  for (const run of runs) {
    setFontForRun(doc, run.script, style);
    w += doc.widthOfString(run.text);
  }
  return w;
};
