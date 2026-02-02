
// components/history/PrintableChapterPDF.ts
import { jsPDF } from 'jspdf';
import { preparePdfDoc, pdfTextMixed, wrapMixedText, setPdfFontForText } from '../../utils/pdfFonts';
import { HistoryChapter } from '../../types';
import { formatTimestampADBS, formatDateADBS } from '../../dateConverter';
import { getMediaKindFromUrl } from '../../utils/media';

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
  
  const fontState = await preparePdfDoc(doc);
  const settings = getPaperSettings(doc, paperSize);
  const { margin, contentWidth, baseFontSize, titleFontSize, headerFontSize, footerFontSize, lineHeightFactor } = settings;
  let yPos: number = margin;
  
  const churchName = "BEM Church"; // Hardcoded English name
  const subtitle = "Church History"; // Hardcoded English subtitle

  doc.setFont(ForPdf(churchName), 'bold');
  doc.setFontSize(headerFontSize);
  doc.text(churchName, settings.pageWidth / 2, yPos, { align: 'center' });
  yPos += headerFontSize * 0.7;
  
  doc.setFont(ForPdf(subtitle), 'normal');
  doc.setFontSize(headerFontSize * 0.8);
  doc.text(subtitle, settings.pageWidth / 2, yPos, { align: 'center' });
  yPos += headerFontSize * 0.8;
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, settings.pageWidth - margin, yPos);
  yPos += 8;

  const chapterTitleText = `Chapter ${chapter.chapterNumber}: ${chapter.title}`;
  doc.setFont(ForPdf(chapterTitleText), 'bold');
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

  const chapterMediaKind = getMediaKindFromUrl(chapter.imageUrl);

  if (chapter.imageUrl && chapterMediaKind === 'image') {
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
  
  doc.setFont(ForPdf(chapter.content), 'normal');
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
        doc.setFont(ForPdf(line), 'normal');
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

