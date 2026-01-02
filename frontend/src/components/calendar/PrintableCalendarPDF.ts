
// components/calendar/PrintableCalendarPDF.ts
import { jsPDF } from 'jspdf';
import { EventItem, MonthlyThemeImage } from '../../types';
import { adToBsSimulated, bsToAdSimulated, getDaysInBsMonthSimulated, formatDateADBS } from '../../dateConverter';

const BS_MONTH_NAMES_EN_PDF = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Ashwin", "Kartik", "Mangsir", "Poush", "Magh",
  "Falgun", "Chaitra"
];
const AD_MONTH_NAMES_EN_PDF = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];
const DAY_LABELS_EN_PDF = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


type PaperSizeType = 'a4' | 'a3' | 'a2' | 'a1';

interface PaperSettings {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  baseFontSize: number;
  headerFontSize: number;
  subHeaderFontSize: number;
  gridCellBaseSize: number; 
  themeImageHeight: number; 
  qrCodeSize: number;
  footerHeight: number;
}

const NotoSansDevanagariBase64: string = "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE";
const DEVANAGARI_FONT_NAME = 'NotoSansDevanagariCustomPDF'; 
const BASE_FONT_NAME = 'Helvetica'; 
let isDevanagariFontSuccessfullyEmbedded = false;


const getPaperSettings = (doc: jsPDF, paperSize: PaperSizeType): PaperSettings => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let settingsPart: Omit<PaperSettings, 'pageWidth' | 'pageHeight'>;

  switch (paperSize) {
    case 'a1':
      settingsPart = { margin: 25, baseFontSize: 16, headerFontSize: 32, subHeaderFontSize: 22, gridCellBaseSize: 30, themeImageHeight: 100, qrCodeSize: 35, footerHeight: 40 };
      break;
    case 'a2':
      settingsPart = { margin: 20, baseFontSize: 12, headerFontSize: 26, subHeaderFontSize: 16, gridCellBaseSize: 25, themeImageHeight: 80, qrCodeSize: 30, footerHeight: 35 };
      break;
    case 'a3':
      settingsPart = { margin: 15, baseFontSize: 10, headerFontSize: 20, subHeaderFontSize: 13, gridCellBaseSize: 20, themeImageHeight: 60, qrCodeSize: 25, footerHeight: 30 };
      break;
    case 'a4':
    default:
      settingsPart = { margin: 10, baseFontSize: 8, headerFontSize: 16, subHeaderFontSize: 11, gridCellBaseSize: 15, themeImageHeight: 45, qrCodeSize: 20, footerHeight: 25 };
      break;
  }
  return { pageWidth: Number(pageWidth), pageHeight: Number(pageHeight), ...settingsPart };
};


const getCurrentFontForPdf = (text: string): string => {
  if (isDevanagariFontSuccessfullyEmbedded && text && /[^\x00-\x7F]+/.test(text)) { 
    return DEVANAGARI_FONT_NAME;
  }
  return BASE_FONT_NAME;
};


const getAdMonthNameForPdf = (monthIndex: number, year: number): string => {
  const date = new Date(year, monthIndex, 1);
  return AD_MONTH_NAMES_EN_PDF[date.getMonth()];
};

const getEventsForDay = (adDate: Date, allEvents: EventItem[]): EventItem[] => {
  return allEvents.filter(event => {
    if (!event.date) return false;
    const eventAdDate = new Date(event.date);
    return eventAdDate.getFullYear() === adDate.getFullYear() &&
           eventAdDate.getMonth() === adDate.getMonth() &&
           eventAdDate.getDate() === adDate.getDate();
  });
};

const getEventsForMonthList = (bsMonth: number, bsYear: number, allEvents: EventItem[]): EventItem[] => {
    return allEvents.filter(event => {
        if(!event.date) return false;
        const eventAdDate = new Date(event.date);
        const eventBsDate = adToBsSimulated(eventAdDate);
        return eventBsDate.year === bsYear && eventBsDate.month === bsMonth;
    }).sort((a,b) => new Date(a.date!).getDate() - new Date(b.date!).getDate());
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
            console.warn(`PDF: Fetched blob type ${blob.type} is not an image. URL: ${imageUrl}`);
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


export const generateYearlyCalendarPDF = async (
  bsYearToGenerate: number,
  allEvents: EventItem[],
  churchNameFromUI: string, 
  churchWebsite: string,
  monthlyThemeImages: MonthlyThemeImage[],
  paperSize: PaperSizeType = 'a4'
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'p', 
    unit: 'mm',
    format: paperSize
  });

  isDevanagariFontSuccessfullyEmbedded = false; 
  if (NotoSansDevanagariBase64 && NotoSansDevanagariBase64 !== "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE" && NotoSansDevanagariBase64.length > 100) {
    try {
      doc.addFileToVFS('NotoSansDevanagariCustomPDF.ttf', NotoSansDevanagariBase64); 
      doc.addFont('NotoSansDevanagariCustomPDF.ttf', DEVANAGARI_FONT_NAME, 'normal');
      isDevanagariFontSuccessfullyEmbedded = true;
      console.log("Devanagari font embedded successfully for PDF.");
    } catch (e) {
      console.error("Error embedding Devanagari font for PDF:", e);
    }
  } else {
    console.warn("Devanagari font base64 string is a placeholder or too short. Nepali text may not render correctly in PDF.");
  }

  const settings = getPaperSettings(doc, paperSize);
  const { 
    pageWidth, pageHeight, margin, baseFontSize, 
    headerFontSize, subHeaderFontSize, themeImageHeight, qrCodeSize, footerHeight
  } = settings;
  
  const usableWidth = pageWidth - 2 * margin;

  const indigo700 = '#4338ca'; 
  const indigo600 = '#4f46e5';
  const indigo100 = '#e0e7ff';
  const lightIndigoText = '#eef2ff'; 
  const eventFillColor = '#a5b4fc'; 
  const eventTextColor = '#312e81';
  const saturdayBgColor = indigo100; 
  const saturdayTextColor = indigo700;
  
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(churchWebsite)}&size=${Math.round(qrCodeSize*3.5)}x${Math.round(qrCodeSize*3.5)}&format=png&margin=1`;
  const qrImageData = await fetchImageAsBase64(qrApiUrl);


  for (let bsMonth = 1; bsMonth <= 12; bsMonth++) {
    if (bsMonth > 1) {
      doc.addPage(paperSize, 'p');
    }
    let yPos: number = margin; 

    const bsMonthNameKey = BS_MONTH_NAMES_EN_PDF[bsMonth - 1];
    const bsMonthNameForDisplay = bsMonthNameKey;

    const numDaysInBsMonth = getDaysInBsMonthSimulated(bsMonth, bsYearToGenerate);
    const firstAdDateOfBsMonth = bsToAdSimulated(1, bsMonth, bsYearToGenerate);
    const lastAdDateOfBsMonth = bsToAdSimulated(numDaysInBsMonth, bsMonth, bsYearToGenerate);

    let adMonthHeaderDisplay = getAdMonthNameForPdf(firstAdDateOfBsMonth.getMonth(), firstAdDateOfBsMonth.getFullYear());
    if (firstAdDateOfBsMonth.getMonth() !== lastAdDateOfBsMonth.getMonth()) {
      adMonthHeaderDisplay += ` / ${getAdMonthNameForPdf(lastAdDateOfBsMonth.getMonth(), lastAdDateOfBsMonth.getFullYear())}`;
    }
    let adYearHeaderDisplay = `${firstAdDateOfBsMonth.getFullYear()}`;
    if (firstAdDateOfBsMonth.getFullYear() !== lastAdDateOfBsMonth.getFullYear()) {
      adYearHeaderDisplay += ` / ${lastAdDateOfBsMonth.getFullYear()}`;
    }

    const fullBsMonthTitle = `${bsMonthNameForDisplay} - ${bsYearToGenerate} BS`;
    doc.setFont(getCurrentFontForPdf(fullBsMonthTitle), 'bold');
    doc.setFontSize(headerFontSize);
    doc.setTextColor(indigo700);
    doc.text(fullBsMonthTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += headerFontSize * 0.5;
    
    const adDateSubtitle = `(${adMonthHeaderDisplay} ${adYearHeaderDisplay} AD)`;
    doc.setFont(getCurrentFontForPdf(adDateSubtitle), 'normal'); 
    doc.setFontSize(subHeaderFontSize);
    doc.setTextColor(100, 100, 100);
    doc.text(adDateSubtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += subHeaderFontSize * 0.8;
    doc.setTextColor(0,0,0);

    const currentTheme = monthlyThemeImages.find(img => img.year === bsYearToGenerate && img.month === bsMonth);
    const themeImageUrl = currentTheme?.imageUrls && currentTheme.imageUrls.length > 0 
        ? currentTheme.imageUrls[0] 
        : `https://picsum.photos/seed/pdf_month_${bsMonth}_${bsYearToGenerate}_fallback/1200/300`;
    
    const themeImageData = await fetchImageAsBase64(themeImageUrl);
    if (themeImageData) {
      try {
        let imageType = 'JPEG'; 
        if (themeImageData.startsWith('data:image/png')) imageType = 'PNG';
        else if (themeImageData.startsWith('data:image/jpeg')) imageType = 'JPEG';

        doc.addImage(themeImageData, imageType, margin, yPos, usableWidth, themeImageHeight, undefined, 'FAST');
        if (currentTheme?.quoteOrCaption) {
          const caption = currentTheme.quoteOrCaption;
          doc.setFont(getCurrentFontForPdf(caption), 'italic');
          doc.setFontSize(baseFontSize * 0.75);
          doc.setTextColor(80, 80, 80);
          const captionLines = doc.splitTextToSize(caption, usableWidth - 4);
          const captionYCalculation = yPos + themeImageHeight - (captionLines.length * (baseFontSize * 0.75 * 0.35)) - 3;
          const captionX = margin + usableWidth - 3;
          doc.text(captionLines, captionX, captionYCalculation, { align: 'right'});
          doc.setTextColor(0,0,0);
        }
      } catch (e) {
        console.warn("PDF: Error adding theme image:", e, "URL:", themeImageUrl);
        doc.setFillColor(230,230,230); doc.rect(margin, yPos, usableWidth, themeImageHeight, 'F');
        doc.setFont(BASE_FONT_NAME); doc.text("Image unavailable", usableWidth/2 + margin, yPos + themeImageHeight/2, {align: 'center'});
      }
    } else {
        doc.setFillColor(230,230,230); doc.rect(margin, yPos, usableWidth, themeImageHeight, 'F');
        doc.setFont(BASE_FONT_NAME); doc.text("Theme Image Area", usableWidth/2 + margin, yPos + themeImageHeight/2, {align: 'center'});
    }
    yPos += themeImageHeight + 4;

    const daysOfWeek = DAY_LABELS_EN_PDF;
      
    const cellWidth = usableWidth / 7;
    const dayHeaderCellHeight = baseFontSize * 1.3;
    const maxGridHeight = pageHeight - yPos - margin - footerHeight - 5;
    
    let numWeeks = 6;
    const firstDayOfWeekOfBsMonth = firstAdDateOfBsMonth.getDay();
    if ((firstDayOfWeekOfBsMonth + numDaysInBsMonth) <= 28) numWeeks = 4;
    else if ((firstDayOfWeekOfBsMonth + numDaysInBsMonth) <= 35) numWeeks = 5;
    
    const dayCellHeight = Math.min(settings.gridCellBaseSize, maxGridHeight / numWeeks);

    doc.setFontSize(baseFontSize * 0.9);
    daysOfWeek.forEach((day, index) => {
      doc.setFillColor(indigo600); 
      doc.rect(margin + index * cellWidth, yPos, cellWidth, dayHeaderCellHeight, 'FD');
      doc.setTextColor(lightIndigoText);
      doc.setFont(getCurrentFontForPdf(day));
      doc.text(day, margin + index * cellWidth + cellWidth / 2, yPos + dayHeaderCellHeight / 2 + (baseFontSize*0.25), { align: 'center' });
    });
    doc.setTextColor(0,0,0); 
    yPos += dayHeaderCellHeight;

    let currentBsDay = 1;
    for (let week = 0; week < numWeeks; week++) {
      if (currentBsDay > numDaysInBsMonth) break;
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellX = margin + dayOfWeek * cellWidth;
        const cellY = yPos + week * dayCellHeight;
        doc.setDrawColor(200, 200, 200); 
        
        const isSaturdayCell = dayOfWeek === 6; 

        if ((week === 0 && dayOfWeek < firstDayOfWeekOfBsMonth) || currentBsDay > numDaysInBsMonth) {
          doc.setFillColor(250, 250, 250); 
          doc.rect(cellX, cellY, cellWidth, dayCellHeight, 'FD');
        } else {
          if (isSaturdayCell) {
            doc.setFillColor(saturdayBgColor);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          doc.rect(cellX, cellY, cellWidth, dayCellHeight, 'FD'); 

          const adDateForBsDay = bsToAdSimulated(currentBsDay, bsMonth, bsYearToGenerate);
          const bsDayString = String(currentBsDay);
          doc.setFont(getCurrentFontForPdf(bsDayString), 'bold');
          doc.setFontSize(baseFontSize * 1.1); 
          doc.setTextColor(isSaturdayCell ? saturdayTextColor : '#333333'); 
          doc.text(bsDayString, cellX + cellWidth / 2, cellY + (baseFontSize * 0.6), { align: 'center' });
          
          doc.setFont(BASE_FONT_NAME, 'normal'); 
          doc.setFontSize(baseFontSize * 0.65); 
          doc.setTextColor(isSaturdayCell ? indigo600 : '#666666');
          doc.text(String(adDateForBsDay.getDate()), cellX + 1.5, cellY + (baseFontSize * 0.3));
          
          const eventsOnThisDay = getEventsForDay(adDateForBsDay, allEvents);
          if (eventsOnThisDay.length > 0) {
            let eventYOffsetInCell = baseFontSize * 1; 
            const eventLineHeight = baseFontSize * 0.35;
            const maxEventsToDisplay = Math.floor((dayCellHeight - eventYOffsetInCell -1) / eventLineHeight);

            eventsOnThisDay.slice(0, maxEventsToDisplay > 0 ? maxEventsToDisplay : 1).forEach((event) => { 
              if (eventYOffsetInCell < dayCellHeight - eventLineHeight) {
                doc.setFont(getCurrentFontForPdf(event.title), 'normal');
                doc.setFontSize(baseFontSize * 0.6);
                const eventTextLines = doc.splitTextToSize(event.title, cellWidth - 2);
                doc.setFillColor(eventFillColor);
                doc.rect(cellX + 1, cellY + eventYOffsetInCell - (eventLineHeight * 0.6), cellWidth - 2, eventLineHeight, 'F');
                doc.setTextColor(eventTextColor); 
                doc.text(eventTextLines[0], cellX + 1.5, cellY + eventYOffsetInCell);
                eventYOffsetInCell += eventLineHeight * 1.1; 
              }
            });
            if (eventsOnThisDay.length > maxEventsToDisplay && maxEventsToDisplay > 0) {
                doc.setFont(BASE_FONT_NAME, 'italic');
                doc.setFontSize(baseFontSize * 0.5);
                doc.setTextColor('#888888');
                doc.text(`+${eventsOnThisDay.length - maxEventsToDisplay} more`, cellX + cellWidth / 2, cellY + dayCellHeight - 1.5, { align: 'center' });
            }
          }
          doc.setTextColor(0,0,0); 
          currentBsDay++;
        }
      }
    }
    yPos += numWeeks * dayCellHeight;

    const smallerImagesVerticalSpace = 5;
    yPos += smallerImagesVerticalSpace;

    if (currentTheme && currentTheme.imageUrls && currentTheme.imageUrls.length > 1) {
        const smallerImageUrls = currentTheme.imageUrls.slice(1, 4);
        if (smallerImageUrls.length > 0) {
            const sectionTitleHeight = baseFontSize * 0.6 + 2;
            const singleSmallerImageHeight = 30;
            const requiredHeightForThisSection = sectionTitleHeight + singleSmallerImageHeight + 3;
            const minSpaceForEventListTitleAndOneEvent = (baseFontSize * 0.7) + (baseFontSize * 0.45) + 3; 

            if (yPos + requiredHeightForThisSection + minSpaceForEventListTitleAndOneEvent <= pageHeight - margin - footerHeight) {
                doc.setFont(BASE_FONT_NAME, 'bold');
                doc.setFontSize(baseFontSize * 0.9);
                doc.setTextColor(indigo700);
                doc.text("Additional Monthly Images:", margin, yPos);
                yPos += sectionTitleHeight;

                const numSmallerImages = smallerImageUrls.length;
                const smallerImageSpacing = 2;
                const totalSpacing = (numSmallerImages - 1) * smallerImageSpacing;
                const dynamicSmallerImageWidth = Math.min((usableWidth - totalSpacing) / numSmallerImages, usableWidth / 2.5);

                let currentX = margin;
                for (const imageUrl of smallerImageUrls) {
                    if (currentX + dynamicSmallerImageWidth > margin + usableWidth + 0.1) break; 

                    const imageData = await fetchImageAsBase64(imageUrl);
                    if (imageData) {
                        try {
                            let imageType = 'JPEG';
                            if (imageData.startsWith('data:image/png')) imageType = 'PNG';
                            else if (imageData.startsWith('data:image/jpeg')) imageType = 'JPEG';
                            doc.addImage(imageData, imageType, currentX, yPos, dynamicSmallerImageWidth, singleSmallerImageHeight, undefined, 'FAST');
                            doc.setDrawColor(200, 200, 200); 
                            doc.rect(currentX, yPos, dynamicSmallerImageWidth, singleSmallerImageHeight, 'S');
                        } catch (e) {
                            console.warn("PDF: Error adding smaller image:", e, "URL:", imageUrl);
                            doc.setFillColor(240, 240, 240);
                            doc.rect(currentX, yPos, dynamicSmallerImageWidth, singleSmallerImageHeight, 'FD');
                            doc.setFont(BASE_FONT_NAME); doc.setFontSize(baseFontSize * 0.5);
                            doc.setTextColor(150, 150, 150);
                            doc.text("Img err", currentX + dynamicSmallerImageWidth / 2, yPos + singleSmallerImageHeight / 2, { align: 'center' });
                            doc.setTextColor(0,0,0);
                        }
                    } else {
                         doc.setFillColor(240, 240, 240);
                         doc.rect(currentX, yPos, dynamicSmallerImageWidth, singleSmallerImageHeight, 'FD');
                         doc.setFont(BASE_FONT_NAME); doc.setFontSize(baseFontSize * 0.5);
                         doc.setTextColor(150, 150, 150);
                         doc.text("No img", currentX + dynamicSmallerImageWidth / 2, yPos + singleSmallerImageHeight / 2, { align: 'center' });
                         doc.setTextColor(0,0,0);
                    }
                    currentX += dynamicSmallerImageWidth + smallerImageSpacing;
                }
                yPos += singleSmallerImageHeight + 3;
            }
        }
    }

    const eventsThisMonth = getEventsForMonthList(bsMonth, bsYearToGenerate, allEvents);
    let eventsListYStart = yPos + 5;
    const eventsListMaxHeight = pageHeight - eventsListYStart - margin - footerHeight + 10; 
    let eventsDrawnCount = 0;

    if (eventsThisMonth.length > 0 && eventsListMaxHeight > (baseFontSize * 2)) { 
        doc.setFont(BASE_FONT_NAME, 'bold');
        doc.setFontSize(baseFontSize);
        doc.setTextColor(indigo700);
        doc.text('Events this Month:', margin, eventsListYStart);
        eventsListYStart += baseFontSize * 0.7;

        doc.setFontSize(baseFontSize * 0.8);
        doc.setTextColor(0,0,0);
        
        let currentEventY = eventsListYStart;
        for (const event of eventsThisMonth) {
            if (currentEventY + (baseFontSize * 0.45) > pageHeight - margin - footerHeight) break; 
            
            const eventDateBs = adToBsSimulated(new Date(event.date!));
            const eventDateAdFormatted = (formatDateADBS(event.date!).split(' (')[1] || event.date!).replace(')',''); 
            const eventText = `${eventDateBs.day} ${bsMonthNameForDisplay} - ${event.title} (${eventDateAdFormatted})`;
            
            doc.setFont(getCurrentFontForPdf(eventText)); 
            const splitEventText = doc.splitTextToSize(eventText, usableWidth);
            const textBlockHeight = splitEventText.length * (baseFontSize * 0.45);
            
            if (currentEventY + textBlockHeight > pageHeight - margin - footerHeight) break;

            doc.text(splitEventText, margin, currentEventY);
            currentEventY += textBlockHeight + 1;
            eventsDrawnCount++;
        }
        if (eventsDrawnCount < eventsThisMonth.length) {
            doc.setFont(BASE_FONT_NAME, 'italic');
            doc.setFontSize(baseFontSize * 0.7);
            doc.setTextColor(120,120,120);
            doc.text(`...and ${eventsThisMonth.length - eventsDrawnCount} more events not shown due to space.`, margin, currentEventY);
        }
    } else if (eventsListMaxHeight > (baseFontSize * 2)) {
        doc.setFont(BASE_FONT_NAME, 'italic');
        doc.setFontSize(baseFontSize * 0.9);
        doc.setTextColor(150,150,150);
        doc.text("No events scheduled for this month.", margin, eventsListYStart + (baseFontSize * 0.5));
    }
  } 

  const totalPages = doc.getNumberOfPages();
  const currentYear = new Date().getFullYear();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerYBase = pageHeight - footerHeight + 3;
    const footerLineHeight = baseFontSize * 0.45;
    
    doc.setFontSize(baseFontSize * 0.75);
    doc.setTextColor(80, 80, 80);
    
    // Left side info
    let currentFooterYPos = footerYBase;
    doc.setFont(getCurrentFontForPdf(churchNameFromUI), 'bold');
    doc.text(churchNameFromUI, margin, currentFooterYPos);
    currentFooterYPos += footerLineHeight;
    doc.setFont(BASE_FONT_NAME, 'normal');
    doc.text(`Email: shahidsingh1432@gmail.com`, margin, currentFooterYPos);
    currentFooterYPos += footerLineHeight;
    doc.text(`Phone: +977-9865272258`, margin, currentFooterYPos);
    
    // Right side info
    const qrXPos = pageWidth - margin - qrCodeSize;
    if (qrImageData) {
      try {
        doc.addImage(qrImageData, 'PNG', qrXPos, footerYBase, qrCodeSize, qrCodeSize, undefined, 'FAST');
      } catch (e) { console.warn("PDF: Error adding QR code to footer:", e); }
    }
    const websiteText = `Visit us: ${churchWebsite}`;
    const websiteTextWidth = doc.getTextWidth(websiteText);
    doc.textWithLink(
      websiteText, 
      pageWidth - margin - websiteTextWidth, 
      footerYBase + qrCodeSize + footerLineHeight, 
      { url: churchWebsite }
    );
    
    // Centered Page Number
    doc.setFont(BASE_FONT_NAME, 'normal');
    doc.setFontSize(baseFontSize * 0.8);
    doc.setTextColor(150, 150, 150);
    const pageNumText = `Page ${i} of ${totalPages} | © ${currentYear} ${churchNameFromUI}`;
    const textWidth = doc.getTextWidth(pageNumText);
    doc.text(pageNumText, (pageWidth - textWidth) / 2, pageHeight - margin / 2, { align: 'center' });
    doc.setTextColor(0,0,0); 
  }

  doc.save(`BEM_Calendar_${bsYearToGenerate}_BS_${paperSize}.pdf`);
};
