import { Request, Response } from "express";
import { PassThrough } from "stream";
import PDFDocument from "pdfkit";
import path from "path";

type PdfDoc = InstanceType<typeof PDFDocument>;

const fontBase = path.join(__dirname, "..", "..", "assets", "fonts");

const fonts = {
  latinRegular: path.join(fontBase, "NotoSans-Regular.ttf"),
  latinBold: path.join(fontBase, "NotoSans-Bold.ttf"),
  devRegular: path.join(fontBase, "NotoSansDevanagari-Regular.ttf"),
  devBold: path.join(fontBase, "NotoSansDevanagari-Bold.ttf"),
};

const isDevanagari = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0;
  return c >= 0x0900 && c <= 0x097f;
};

const safeFont = (doc: PdfDoc, fontPath: string, fallbackPathOrName: string) => {
  try {
    doc.font(fontPath);
  } catch {
    doc.font(fallbackPathOrName as any);
  }
};

const drawMixedLine = (doc: PdfDoc, text: string, x: number, y: number, bold = false) => {
  let xx = x;
  let buf = "";
  let cur: "dev" | "latin" | null = null;

  const flush = () => {
    if (!buf) return;

    if (cur === "dev") safeFont(doc, bold ? fonts.devBold : fonts.devRegular, fonts.devRegular);
    else safeFont(doc, bold ? fonts.latinBold : fonts.latinRegular, fonts.latinRegular);

    doc.text(buf, xx, y, { lineBreak: false });
    xx += doc.widthOfString(buf);
    buf = "";
  };

  for (const ch of String(text ?? "")) {
    const script: "dev" | "latin" = isDevanagari(ch) ? "dev" : "latin";
    if (cur === null) {
      cur = script;
      buf = ch;
    } else if (script === cur) {
      buf += ch;
    } else {
      flush();
      cur = script;
      buf = ch;
    }
  }
  flush();
};

export const getTestPdf = async (_req: Request, res: Response) => {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, left: 48, right: 48, bottom: 48 },
    info: { Title: "PDF Font Test" },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="pdf-font-test.pdf"');
  res.setHeader("Cache-Control", "no-store");

  const stream = new PassThrough();
  doc.pipe(stream);
  stream.pipe(res);

  safeFont(doc, fonts.latinRegular, "Helvetica");

  doc.fontSize(18);
  drawMixedLine(doc, "Bishram Ekata Mandali - PDF Font Test", doc.x, doc.y, true);
  doc.moveDown(1);

  doc.fontSize(12);
  drawMixedLine(doc, "नेपाली Nepali English १२३ ABC xyz", doc.x, doc.y, false);
  doc.moveDown(0.7);

  drawMixedLine(doc, "कार्यक्रम Schedule: 10:00 AM - प्रार्थना Prayer", doc.x, doc.y, false);
  doc.moveDown(0.7);

  drawMixedLine(doc, "धन्यवाद! Thank you!", doc.x, doc.y, true);

  doc.end();
};
