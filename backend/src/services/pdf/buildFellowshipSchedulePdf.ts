import PDFDocument from "pdfkit";
import type * as PDFKit from "pdfkit";
import { drawMixedTextLine, wrapMixedText } from "./text";
import { fontPaths } from "./fonts";

type Item = {
  timeLabel: string;
  title: string;
  speakerName?: string;
  details?: string;
};

export const buildFellowshipSchedulePdf = (params: { churchName: string; items: Item[] }) => {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, left: 48, right: 48, bottom: 48 },
    info: { Title: "Fellowship Schedule" },
  });

  // Register at least one font early so PDFKit embeds properly
  const fp = fontPaths();
  doc.font(fp.latinRegular);

  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;

  let y = doc.y;

  // Header
  doc.fontSize(16);
  drawMixedTextLine(doc, params.churchName, margin, y, "bold");
  y += 24;

  doc.fontSize(14);
  drawMixedTextLine(doc, "Fellowship Schedule", margin, y, "bold");
  y += 18;

  doc.moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 14;

  // Body
  doc.fontSize(11);

  for (const item of params.items) {
    const line1 = item.timeLabel ? `${item.timeLabel} - ${item.title}` : item.title;

    // wrap title line
    const lines = wrapMixedText(doc, line1, contentWidth, "bold");
    for (const ln of lines) {
      drawMixedTextLine(doc, ln, margin, y, "bold");
      y += 16;
      if (y > doc.page.height - doc.page.margins.bottom - 60) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    if (item.speakerName) {
      const sLines = wrapMixedText(doc, `Speaker: ${item.speakerName}`, contentWidth - 12, "normal");
      for (const ln of sLines) {
        drawMixedTextLine(doc, ln, margin + 12, y, "normal");
        y += 14;
      }
    }

    if (item.details) {
      const dLines = wrapMixedText(doc, item.details, contentWidth - 12, "normal");
      for (const ln of dLines) {
        drawMixedTextLine(doc, ln, margin + 12, y, "normal");
        y += 14;
      }
    }

    y += 8;
    if (y > doc.page.height - doc.page.margins.bottom - 60) {
      doc.addPage();
      y = doc.page.margins.top;
    }
  }

  // Footer
  const footerY = doc.page.height - doc.page.margins.bottom + 14;
  doc.fontSize(9);
  drawMixedTextLine(doc, params.churchName, pageWidth / 2 - 80, footerY, "bold");

  return doc;
};
