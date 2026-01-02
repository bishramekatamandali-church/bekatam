// components/history/PrintableChapterPDF.ts
import { jsPDF } from 'jspdf';
import { HistoryChapter } from '../../types';
import { formatTimestampADBS, formatDateADBS } from '../../dateConverter';

const NotoSansDevanagariBase64: string = "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE"; 
const DEVANAGARI_FONT_NAME = 'NotoSansDevanagariCustom'; 
const BASE_FONT_NAME = 'Helvetica'; 
let isDevanagariFontSuccessfullyEmbedded = false;

type PaperSizeType = 'a5' | 'b5' | 'book6x9' | 'a4'; 

interface PaperSettings {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  baseFontSize: number;
  titleFontSize: number;
  headerFontSize: number; 
  footerFontSize: number;
  lineHeightFactor: number;
}

const getPaperSettings = (doc: jsPDF, paperSize: PaperSizeType): PaperSettings => {
    let pageWidth, pageHeight, margin, baseFontSize, titleFontSize, headerFontSize, footerFontSize, lineHeightFactor;

    switch (paperSize) {
        case 'a5': 
            pageWidth = 148; pageHeight = 210; margin = 15;
            baseFontSize = 10; titleFontSize = 14; headerFontSize = 12; footerFontSize = 8;
            lineHeightFactor = 1.4;
            break;
        case 'b5': 
            pageWidth = 182; pageHeight = 257; margin = 18;
            baseFontSize = 11; titleFontSize = 16; headerFontSize = 13; footerFontSize = 9;
            lineHeightFactor = 1.45;
            break;
        case 'book6x9': 
            pageWidth = 152.4; pageHeight = 228.6; margin = 16; 
            baseFontSize = 10.5; titleFontSize = 15; headerFontSize = 12.5; footerFontSize = 8.5;
            lineHeightFactor = 1.42;
            break;
        case 'a4': 
        default:
            pageWidth = 210; pageHeight = 297; margin = 20;
            baseFontSize = 12; titleFontSize = 18; headerFontSize = 14; footerFontSize = 9;
            lineHeightFactor = 1.5;
            break;
    }
    doc.internal.pageSize.width = pageWidth;
    doc.internal.pageSize.height = pageHeight;
    const contentWidth = pageWidth - 2 * margin;
    return { pageWidth, pageHeight, margin, contentWidth, baseFontSize, titleFontSize, headerFontSize, footerFontSize, lineHeightFactor };
};


const getCurrentFontForPdf = (text: string): string => {
  if (isDevanagariFontSuccessfullyEmbedded && text && /[^\x00-\x7F]+/.test(text)) { 
    return DEVANAGARI_FONT_NAME;
  }
  return BASE_FONT_NAME;
};

const fetchImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
        console.warn("PDF: Invalid image URL provided for base64 conversion:", imageUrl);
        return null;
    }
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            console.error(`PDF: Image fetch HTTP error! Status: ${response.status} for URL: ${imageUrl}`);
            return null;
        }
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            console.warn(`PDF: Fetched blob type ${blob.type} is not an image for URL: ${imageUrl}`);
            return null;
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = (error) => {
                console.error("PDF: FileReader error for image:", error, "URL:", imageUrl);
                reject(error);
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("PDF: Error fetching image as base64:", error, "URL:", imageUrl);
        return null;
    }
};


export const generateChapterPdf = async (
  chapter: HistoryChapter,
  paperSize: PaperSizeType = 'a5'
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: paperSize,
  });
  
  isDevanagariFontSuccessfullyEmbedded = false;
  if (NotoSansDevanagariBase64 && NotoSansDevanagariBase64 !== "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE" && NotoSansDevanagariBase64.length > 100) {
    try {
      doc.addFileToVFS('NotoSansDevanagariCustomPDF.ttf', NotoSansDevanagariBase64); 
      doc.addFont('NotoSansDevanagariCustomPDF.ttf', DEVANAGARI_FONT_NAME, 'normal');
      isDevanagariFontSuccessfullyEmbedded = true;
    } catch (e) {
      console.error("Error embedding Devanagari font for PDF:", e);
    }
  } else {
    console.warn("Devanagari font base64 string is a placeholder or too short. Nepali text may not render correctly in PDF.");
  }

  const settings = getPaperSettings(doc, paperSize);
  const { margin, contentWidth, baseFontSize, titleFontSize, headerFontSize, footerFontSize, lineHeightFactor } = settings;
  let yPos: number = margin;
  
  const churchName = "BEM Church"; // Hardcoded English name
  const subtitle = "Church History"; // Hardcoded English subtitle

  doc.setFont(getCurrentFontForPdf(churchName), 'bold');
  doc.setFontSize(headerFontSize);
  doc.text(churchName, settings.pageWidth / 2, yPos, { align: 'center' });
  yPos += headerFontSize * 0.7;
  
  doc.setFont(getCurrentFontForPdf(subtitle), 'normal');
  doc.setFontSize(headerFontSize * 0.8);
  doc.text(subtitle, settings.pageWidth / 2, yPos, { align: 'center' });
  yPos += headerFontSize * 0.8;
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, settings.pageWidth - margin, yPos);
  yPos += 8;

  const chapterTitleText = `Chapter ${chapter.chapterNumber}: ${chapter.title}`;
  doc.setFont(getCurrentFontForPdf(chapterTitleText), 'bold');
  doc.setFontSize(titleFontSize);
  const titleLines = doc.splitTextToSize(chapterTitleText, contentWidth);
  doc.text(titleLines, settings.pageWidth / 2, yPos, { align: 'center' });
  yPos += titleLines.length * (titleFontSize * 0.5 * lineHeightFactor);
  yPos += 4;

  doc.setFont(BASE_FONT_NAME, 'italic');
  doc.setFontSize(baseFontSize * 0.85);
  if (chapter.authorName) {
    doc.text(`By: ${chapter.authorName}`, margin, yPos);
    yPos += baseFontSize * 0.4 * lineHeightFactor;
  }
  if (chapter.lastPublishedAt) {
    doc.text(`Published: ${(formatDateADBS(chapter.lastPublishedAt).split('(')[0] || '').trim()}`, margin, yPos);
    yPos += baseFontSize * 0.4 * lineHeightFactor;
  } else if (chapter.createdAt) {
    doc.text(`Created: ${(formatDateADBS(chapter.createdAt).split('(')[0] || '').trim()}`, margin, yPos);
    yPos += baseFontSize * 0.4 * lineHeightFactor;
  }
  yPos += 6;

  if (chapter.imageUrl) {
    const imageData = await fetchImageAsBase64(chapter.imageUrl);
    if (imageData) {
      try {
        const imgProps = doc.getImageProperties(imageData);
        const imgWidth = imgProps.width;
        const imgHeight = imgProps.height;
        const aspectRatio = imgWidth / imgHeight;
        
        let pdfImgWidth = contentWidth;
        let pdfImgHeight = contentWidth / aspectRatio;
        const maxImgHeight = settings.pageHeight * 0.35;

        if (pdfImgHeight > maxImgHeight) {
          pdfImgHeight = maxImgHeight;
          pdfImgWidth = pdfImgHeight * aspectRatio;
        }
        if (pdfImgWidth > contentWidth) {
            pdfImgWidth = contentWidth;
            pdfImgHeight = pdfImgWidth / aspectRatio;
        }

        if (yPos + pdfImgHeight > settings.pageHeight - margin - (footerFontSize * 2) - 10) {
          doc.addPage(paperSize, 'p');
          yPos = margin;
        }
        
        let imageType = '';
        if (imageData.startsWith('data:image/jpeg')) imageType = 'JPEG';
        else if (imageData.startsWith('data:image/png')) imageType = 'PNG';
        else { 
            const extension = (chapter.imageUrl.split('.').pop() || '').toLowerCase();
            if (extension === 'png') imageType = 'PNG';
            else imageType = 'JPEG'; 
        }

        doc.addImage(imageData, imageType, margin + (contentWidth - pdfImgWidth) / 2, yPos, pdfImgWidth, pdfImgHeight);
        yPos += pdfImgHeight + 5; 
      } catch (e) {
        console.error("PDF: Error processing or adding image:", e, "URL:", chapter.imageUrl);
      }
    }
  }
  
  doc.setFont(getCurrentFontForPdf(chapter.content), 'normal');
  doc.setFontSize(baseFontSize);
  const contentLines = doc.splitTextToSize(chapter.content, contentWidth);
  
  const addFooter = (currentPage: number, totalPages: number) => {
    doc.setFont(BASE_FONT_NAME, 'normal');
    doc.setFontSize(footerFontSize);
    const footerText = `Page ${currentPage} of ${totalPages} | © ${new Date().getFullYear()} ${churchName}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (settings.pageWidth - textWidth) / 2, settings.pageHeight - (settings.margin / 2));
  };

  const addPageIfNeededAndUpdateYPos = () => {
    if (yPos > settings.pageHeight - margin - footerFontSize * 2) { 
      addFooter(doc.getNumberOfPages(), doc.getNumberOfPages()); 
      doc.addPage(paperSize, 'p');
      yPos = margin;
      return true;
    }
    return false;
  };


  for (const line of contentLines) {
    if (addPageIfNeededAndUpdateYPos()) {
        doc.setFont(getCurrentFontForPdf(line), 'normal');
        doc.setFontSize(baseFontSize);
    }
    doc.text(line, margin, yPos);
    yPos = Number(yPos) + baseFontSize * 0.45 * lineHeightFactor; 
  }

  const totalGeneratedPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalGeneratedPages; i++) {
    doc.setPage(i);
    addFooter(i, totalGeneratedPages);
  }

  doc.save(`Chapter_${chapter.chapterNumber}_${chapter.title.replace(/\s+/g, '_')}.pdf`);
};
