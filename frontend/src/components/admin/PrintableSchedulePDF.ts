
// components/admin/PrintableSchedulePDF.ts
import { jsPDF } from 'jspdf';
import { GeneratedScheduleItem, FellowshipRosterItem } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';

// A subset of a real base64 font string for demonstration. A full one would be very large.
const NotoSansDevanagariBase64: string = "AAEAAAARAQAABAAQR0RFRgBsAmsAAEV0AAAABkdQT1O2B51VAAEVrAAAAGxHU1VC4spaYQAA+LAAAAA4T1MvMmpgKQQAAAFgAAAAYGNtYXABDQGXAAACDAAAAGxnbHlm/nK3EAAABWAAAAJgaGVhZBsAmsAAAADcAAAANmhoZWEH3gOFAAABJAAAACRobXR4DAAD/AAAAfQAAAAybG9jYQG8BIwAAARcAAAAMm1heHABGQCbAAABOAAAACBuYW1l406XlQAA+NgAAASxcG9zdBvYcFEAARMUAAAAOwABAAADUv9qAAMAAQAAAAAAAAAAAAAAAAAAAAABAAAD//3PAAEAAQAAAAoAAgAEAAMAAAAAAADUASQAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAgAAAAAAAAAAAAAAAwAAAAMAAAAcAAEAAAAAAHAACAAEAAAAAAG4ABQADAAEAAAAAAAQABAANAAAAAABcABcAEgAAAAAQABgAAgABAAEAEAAg//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8=";
const DEVANAGARI_FONT_NAME = 'NotoSansDevanagariCustomPDF';
const BASE_FONT_NAME = 'Helvetica';
let isDevanagariFontSuccessfullyEmbedded = false;

const getCurrentFont = (text: string): string => {
  if (isDevanagariFontSuccessfullyEmbedded && text && /[^\x00-\x7F]+/.test(text)) {
    return DEVANAGARI_FONT_NAME;
  }
  return BASE_FONT_NAME;
};

const parseAdditionalDetailsForPDF = (detailsString?: string): Record<string, string> => {
  if (!detailsString) return {};
  const details: Record<string, string> = {};
  const lines = detailsString.split('\n');
  lines.forEach(line => {
    const parts = line.split(/:(.*)/s); // Split only on the first colon
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts[1].trim();
      if (value) details[key] = value;
    }
  });
  return details;
};

const setupPdfDoc = (doc: jsPDF, churchName: string, documentTitle: string): { yPos: number, contentWidth: number, margin: number, baseFontSize: number, titleFontSize: number, headerFontSize: number, lineSpacing: number, sectionSpacing: number, pageHeight: number, pageWidth: number } => {
    isDevanagariFontSuccessfullyEmbedded = false;
    if (NotoSansDevanagariBase64 && NotoSansDevanagariBase64 !== "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE" && NotoSansDevanagariBase64.length > 100) {
        try {
        doc.addFileToVFS('NotoSansDevanagariCustomPDF.ttf', NotoSansDevanagariBase64);
        doc.addFont('NotoSansDevanagariCustomPDF.ttf', DEVANAGARI_FONT_NAME, 'normal');
        isDevanagariFontSuccessfullyEmbedded = true;
        } catch (e) { console.error("Error embedding Devanagari font for PDF:", e); }
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;
    const lineSpacing = 6;
    const sectionSpacing = 8;
    const baseFontSize = 10;
    const titleFontSize = 16;
    const headerFontSize = 12;

    const churchNameForPDF = churchName;
    
    doc.setFont(getCurrentFont(churchNameForPDF), 'bold');
    doc.setFontSize(titleFontSize);
    doc.text(churchNameForPDF, pageWidth / 2, yPos, { align: 'center' });
    yPos += titleFontSize * 0.7;

    doc.setFont(BASE_FONT_NAME, 'normal');
    doc.setFontSize(headerFontSize * 0.9);
    doc.text(documentTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += headerFontSize * 0.9 + sectionSpacing * 0.5;
    
    return { yPos, contentWidth, margin, baseFontSize, titleFontSize, headerFontSize, lineSpacing, sectionSpacing, pageHeight, pageWidth };
};

const addDetailLineToPdf = (doc: jsPDF, label: string, value: string | number | null | undefined, yPosRef: { current: number }, settings: ReturnType<typeof setupPdfDoc>, options: { isPotentiallyMultilingualValue?: boolean, isMultiLine?: boolean } = {}) => {
    if (value === undefined || value === null || String(value).trim() === '') return;
    const { isPotentiallyMultilingualValue = false, isMultiLine = false } = options;
    const valueString = String(value).trim();
    
    if (yPosRef.current > settings.pageHeight - settings.margin - 15) { // Check for page break
        doc.addPage();
        yPosRef.current = settings.margin;
    }

    doc.setFont(BASE_FONT_NAME, 'bold');
    doc.setFontSize(settings.baseFontSize);
    doc.text(`${label}:`, settings.margin, yPosRef.current);
    
    const valueFont = isPotentiallyMultilingualValue ? getCurrentFont(valueString) : BASE_FONT_NAME;
    doc.setFont(valueFont, 'normal');
    
    const labelWidth = doc.getTextWidth(`${label}: `) + 1; 
    const valueXPos = settings.margin + labelWidth;
    const textBlockWidth = settings.contentWidth - labelWidth;
    
    const lines = doc.splitTextToSize(valueString, textBlockWidth);
    doc.text(lines, valueXPos, yPosRef.current);
    yPosRef.current = Number(yPosRef.current) + (lines.length * settings.lineSpacing * 0.7) + (isMultiLine ? 2 : 1); 
    doc.setFont(BASE_FONT_NAME, 'normal');
};


export const generateSchedulePDF = async (
  schedule: GeneratedScheduleItem,
  churchNameFromUI: string,
  churchWebsite: string
): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const settings = setupPdfDoc(doc, churchNameFromUI, "Generated Program Schedule");
  let yPosRef = { current: settings.yPos };

  const scheduleTitle = schedule.groupNameOrEventTitle || 'Untitled Schedule';
  doc.setFont(getCurrentFont(scheduleTitle), 'bold');
  doc.setFontSize(settings.headerFontSize);
  const titleLines = doc.splitTextToSize(scheduleTitle, settings.contentWidth);
  doc.text(titleLines, settings.margin, yPosRef.current);
  yPosRef.current += titleLines.length * (settings.headerFontSize * 0.5) + settings.sectionSpacing * 0.5;
  
  addDetailLineToPdf(doc, "Date", formatDateADBS(schedule.scheduledDate), yPosRef, settings, { isPotentiallyMultilingualValue: true });
  addDetailLineToPdf(doc, "Time", schedule.timeSlot, yPosRef, settings, { isPotentiallyMultilingualValue: true });
  addDetailLineToPdf(doc, "Location", schedule.location, yPosRef, settings, { isPotentiallyMultilingualValue: true });
  addDetailLineToPdf(doc, "Contact Number", schedule.contactNumber, yPosRef, settings);
  addDetailLineToPdf(doc, "Program Type", schedule.rosterType, yPosRef, settings, { isPotentiallyMultilingualValue: true });
  
  if (schedule.responsibilities && schedule.responsibilities.length > 0) {
    yPosRef.current += settings.sectionSpacing * 0.3;
    doc.setFont(BASE_FONT_NAME, 'bold'); doc.text("Responsibilities:", settings.margin, yPosRef.current);
    yPosRef.current += settings.lineSpacing;
    (schedule.responsibilities || []).forEach(resp => {
        addDetailLineToPdf(doc, `  ${resp.role}`, resp.assignedTo, yPosRef, settings, { isPotentiallyMultilingualValue: true });
    });
  }

  yPosRef.current += settings.sectionSpacing * 0.5;
  doc.setLineWidth(0.2); doc.line(settings.margin, yPosRef.current, doc.internal.pageSize.getWidth() - settings.margin, yPosRef.current);
  yPosRef.current += settings.sectionSpacing * 0.5;

  const specificDetails = parseAdditionalDetailsForPDF(schedule.additionalNotesOrProgramDetails);
  if (Object.keys(specificDetails).length > 0) {
    doc.setFont(BASE_FONT_NAME, 'bold'); doc.text("Specific Program Details:", settings.margin, yPosRef.current);
    yPosRef.current += settings.lineSpacing;
    Object.entries(specificDetails).forEach(([key, value]) => addDetailLineToPdf(doc, `  ${key}`, value, yPosRef, settings, { isPotentiallyMultilingualValue: true, isMultiLine: true }));
    yPosRef.current += settings.sectionSpacing * 0.5;
    doc.line(settings.margin, yPosRef.current, doc.internal.pageSize.getWidth() - settings.margin, yPosRef.current);
    yPosRef.current += settings.sectionSpacing * 0.5;
  }
  
  if (schedule.adminNotes) {
    doc.setFont(BASE_FONT_NAME, 'bold'); doc.text("Admin Notes (Internal):", settings.margin, yPosRef.current);
    yPosRef.current += settings.lineSpacing;
    addDetailLineToPdf(doc, "", schedule.adminNotes, yPosRef, settings, { isPotentiallyMultilingualValue: true, isMultiLine: true });
  }

  // Footer
  const footerYBase = settings.pageHeight - settings.margin - (settings.baseFontSize * 0.8 * 2); // Position for 2 lines of footer
  doc.setFont(BASE_FONT_NAME, 'italic'); doc.setFontSize(settings.baseFontSize * 0.8);
  
  const generatedOnText = `Generated on: ${formatTimestampADBS(new Date().toISOString())}`;
  doc.text(generatedOnText, settings.margin, footerYBase);
  
  const churchNameForFooter = churchNameFromUI;
  doc.setFont(getCurrentFont(churchNameForFooter), 'bold');
  doc.text(churchNameForFooter, settings.pageWidth / 2, footerYBase + (settings.baseFontSize * 0.8 * 1.2) , { align: 'center' });

  doc.setFont(BASE_FONT_NAME, 'italic');
  const websiteText = `Visit us: ${churchWebsite}`;
  doc.textWithLink(websiteText, settings.pageWidth - settings.margin - doc.getTextWidth(websiteText), footerYBase, { url: churchWebsite });


  doc.save(`Schedule_${schedule.groupNameOrEventTitle.replace(/\s+/g, '_')}_${schedule.scheduledDate}.pdf`);
};


export const generateRosterItemPDF = async (
  rosterItem: FellowshipRosterItem,
  churchName: string,
  churchWebsite: string
): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const settings = setupPdfDoc(doc, churchName, "Fellowship Roster Item Details");
  let yPosRef = { current: settings.yPos };

  const rosterTitle = rosterItem.groupNameOrEventTitle || 'Untitled Roster Item';
  doc.setFont(getCurrentFont(rosterTitle), 'bold');
  doc.setFontSize(settings.headerFontSize);
  const titleLines = doc.splitTextToSize(rosterTitle, settings.contentWidth);
  doc.text(titleLines, settings.margin, yPosRef.current);
  yPosRef.current += titleLines.length * (settings.headerFontSize * 0.5) + settings.sectionSpacing * 0.5;
  
  addDetailLineToPdf(doc, "Assigned Date", formatDateADBS(rosterItem.assignedDate), yPosRef, settings, { isPotentiallyMultilingualValue: true });
  addDetailLineToPdf(doc, "Time Slot", rosterItem.timeSlot, yPosRef, settings, { isPotentiallyMultilingualValue: true });
  addDetailLineToPdf(doc, "Location", rosterItem.location, yPosRef, settings, { isPotentiallyMultilingualValue: true });
  addDetailLineToPdf(doc, "Contact Number", rosterItem.contactNumber, yPosRef, settings);
  addDetailLineToPdf(doc, "Roster Type", rosterItem.rosterType, yPosRef, settings, { isPotentiallyMultilingualValue: true });
  addDetailLineToPdf(doc, "Is Template", rosterItem.isTemplate ? "Yes" : "No", yPosRef, settings);
  
  if (rosterItem.responsibilities && rosterItem.responsibilities.length > 0) {
    yPosRef.current += settings.sectionSpacing * 0.3;
    doc.setFont(BASE_FONT_NAME, 'bold'); doc.text("Responsibilities:", settings.margin, yPosRef.current);
    yPosRef.current += settings.lineSpacing;
    (rosterItem.responsibilities || []).forEach(resp => {
        addDetailLineToPdf(doc, `  ${resp.role}`, resp.assignedTo, yPosRef, settings, { isPotentiallyMultilingualValue: true });
    });
  }


  yPosRef.current += settings.sectionSpacing * 0.5;
  doc.setLineWidth(0.2); doc.line(settings.margin, yPosRef.current, doc.internal.pageSize.getWidth() - settings.margin, yPosRef.current);
  yPosRef.current += settings.sectionSpacing * 0.5;

  const specificDetails = parseAdditionalDetailsForPDF(rosterItem.additionalNotesOrProgramDetails);
  if (Object.keys(specificDetails).length > 0) {
    doc.setFont(BASE_FONT_NAME, 'bold'); doc.text("Specific Inputted Details:", settings.margin, yPosRef.current);
    yPosRef.current += settings.lineSpacing;
    Object.entries(specificDetails).forEach(([key, value]) => addDetailLineToPdf(doc, `  ${key}`, value, yPosRef, settings, { isPotentiallyMultilingualValue: true, isMultiLine: true }));
  } else if (rosterItem.additionalNotesOrProgramDetails) { 
    doc.setFont(BASE_FONT_NAME, 'bold'); doc.text("Additional Details/Notes:", settings.margin, yPosRef.current);
    yPosRef.current += settings.lineSpacing;
    addDetailLineToPdf(doc, "", rosterItem.additionalNotesOrProgramDetails, yPosRef, settings, { isPotentiallyMultilingualValue: true, isMultiLine: true });
  }
  
  const footerYBase = settings.pageHeight - settings.margin - (settings.baseFontSize * 0.8 * 2);
  doc.setFont(BASE_FONT_NAME, 'italic'); doc.setFontSize(settings.baseFontSize * 0.8);
  
  let leftFooterText = '';
  if (rosterItem.createdAt) leftFooterText = `Created: ${formatTimestampADBS(rosterItem.createdAt)}`;
  doc.text(leftFooterText, settings.margin, footerYBase);

  const churchNameForFooter = churchName;
  doc.setFont(getCurrentFont(churchNameForFooter), 'bold');
  doc.text(churchNameForFooter, settings.pageWidth / 2, footerYBase + (settings.baseFontSize * 0.8 * 1.2), { align: 'center' });

  doc.setFont(BASE_FONT_NAME, 'italic');
  if(rosterItem.postedByOwnerName) {
      const postedByText = `Posted by: ${rosterItem.postedByOwnerName}`;
      doc.text(postedByText, settings.pageWidth - settings.margin - doc.getTextWidth(postedByText), footerYBase);
  }

  doc.save(`RosterItem_${rosterItem.groupNameOrEventTitle.replace(/\s+/g, '_')}.pdf`);
};
