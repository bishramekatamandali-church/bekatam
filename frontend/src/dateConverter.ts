// dateConverter.ts
import { BSSimulatedDate, ContentItem, GenericContentFormData, ContentType, BaseContentFormData } from './types'; 

// WARNING: This is a placeholder and NOT an accurate BS converter.
// In a real application, use a library like 'ad-bs-converter' or 'bikram-sambat-js'.

export const AD_BS_YEAR_DIFF = 56; // Export this constant
const AD_BS_MONTH_DIFF_APPROX = 8; // BS months are "ahead" by approx 8.5 months
const AD_BS_DAY_DIFF_APPROX = 17;  // BS days are "ahead" by approx 17 days

export const BS_MONTH_NAMES_EN = [ // Exported
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Ashwin", "Kartik", "Mangsir", "Poush", "Magh",
  "Falgun", "Chaitra"
];

// Rough estimate of days in BS months (Baishakh to Chaitra)
// This does NOT account for leap years or actual BS calendar variations.
const BS_MONTH_DAYS_SIMULATED: number[] = [30, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30];

export const getDaysInBsMonthSimulated = (bsMonth: number, bsYear: number): number => {
  // For this simulation, bsYear is ignored. A real calendar would use it.
  if (bsMonth >= 1 && bsMonth <= 12) {
    return BS_MONTH_DAYS_SIMULATED[bsMonth - 1];
  }
  return 30; // Default fallback
};


export const adToBsSimulated = (adDate: Date): BSSimulatedDate => {
  const adYear = adDate.getFullYear();
  const adMonth = adDate.getMonth(); // 0-11 for Jan-Dec
  const adDay = adDate.getDate();

  let bsYear = adYear + AD_BS_YEAR_DIFF;
  let bsMonth = adMonth + 1 + AD_BS_MONTH_DIFF_APPROX; // adMonth is 0-indexed, convert to 1-indexed
  let bsDay = adDay + AD_BS_DAY_DIFF_APPROX;

  // Simple overflow logic (highly approximate)
  // This needs to be much more sophisticated for real BS calendar logic
  
  // Ensure bsMonth is provisionally valid (1-24 range initially) before getting days in month
  let tempBsMonthForDays = bsMonth;
  if (tempBsMonthForDays > 12) {
      tempBsMonthForDays = tempBsMonthForDays % 12;
      if (tempBsMonthForDays === 0) tempBsMonthForDays = 12; // handle case where modulo is 0
  }
  if (tempBsMonthForDays < 1) tempBsMonthForDays = 1;


  if (bsDay > getDaysInBsMonthSimulated(tempBsMonthForDays, bsYear)) { 
    bsDay -= getDaysInBsMonthSimulated(tempBsMonthForDays, bsYear); 
    bsMonth++;
  }
  
  if (bsMonth > 12) {
    bsMonth -= 12;
    bsYear++;
  }

  // Ensure results are within plausible BS ranges (1-12 for month, 1-32 for day)
  bsMonth = Math.max(1, Math.min(12, bsMonth));
  bsDay = Math.max(1, Math.min(getDaysInBsMonthSimulated(bsMonth, bsYear), bsDay));


  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthName: BS_MONTH_NAMES_EN[bsMonth - 1] || "Unknown",
    dayOfWeek: adDate.getDay(), // Keep AD day of week
  };
};

export const bsToAdSimulated = (bsDay: number, bsMonth: number, bsYear: number): Date => {
  // Reverse the approximate offset
  let adYearApprox = bsYear - AD_BS_YEAR_DIFF;
  let adMonthApprox = bsMonth - 1 - AD_BS_MONTH_DIFF_APPROX; // bsMonth (1-12) to adMonth (0-11)
  let adDayApprox = bsDay - AD_BS_DAY_DIFF_APPROX;

  // Create an initial estimated AD Date
  let estimatedAdDate = new Date(Date.UTC(adYearApprox, adMonthApprox, adDayApprox));

  // Iterative refinement:
  // Try to find an AD date that converts back to the target BS date
  // Limit iterations to avoid infinite loops in a flawed simulation
  for (let i = 0; i < 60; i++) { // Iterate up to +/- 30 days
      const currentBs = adToBsSimulated(estimatedAdDate);
      if (currentBs.year === bsYear && currentBs.month === bsMonth && currentBs.day === bsDay) {
          return estimatedAdDate; // Found a good match
      }
      // Heuristic adjustment:
      // If bsYear is off, adjust by a large chunk
      if (currentBs.year < bsYear) estimatedAdDate.setDate(estimatedAdDate.getDate() + (bsYear - currentBs.year) * 300); // Simplified
      else if (currentBs.year > bsYear) estimatedAdDate.setDate(estimatedAdDate.getDate() - (currentBs.year - bsYear) * 300);
      // If bsMonth is off
      else if (currentBs.month < bsMonth) estimatedAdDate.setDate(estimatedAdDate.getDate() + (bsMonth - currentBs.month) * 20);
      else if (currentBs.month > bsMonth) estimatedAdDate.setDate(estimatedAdDate.getDate() - (currentBs.month - bsMonth) * 20);
      // If bsDay is off
      else if (currentBs.day < bsDay) estimatedAdDate.setDate(estimatedAdDate.getDate() + (bsDay - currentBs.day));
      else if (currentBs.day > bsDay) estimatedAdDate.setDate(estimatedAdDate.getDate() - (currentBs.day - bsDay));
      else break; // Should not happen if day is also correct
  }
  
  // If iteration doesn't find an exact match, return the last best estimate.
  // This will be inaccurate but is a limitation of the simulation.
  return estimatedAdDate; 
};


export const formatDateADBS = (dateInput?: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (dateInput === undefined || dateInput === '') return 'N/A';

  let adDate: Date;
  if (typeof dateInput === 'string') {
    // Check if string is already in YYYY-MM-DD or ISO format
    if (dateInput.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/)) {
        adDate = new Date(dateInput);
    } else {
        // Attempt to parse other common formats, or assume it might be an invalid string.
        // This part can be risky without knowing all possible input formats.
        // For now, if not ISO-like, we might log a warning or return invalid.
        adDate = new Date(dateInput); // This might produce 'Invalid Date'
        if (isNaN(adDate.getTime())) {
          console.warn(`Invalid date string format received by formatDateADBS: "${dateInput}"`);
          return 'Invalid Date Input';
        }
    }
  } else {
    adDate = dateInput instanceof Date ? dateInput : new Date(dateInput);
  }

  if (isNaN(adDate.getTime())) return 'Invalid Date';

  const adOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
  };
  const adFormatted = adDate.toLocaleDateString('en-US', adOptions);

  try {
    const bs = adToBsSimulated(adDate);
    // Basic validation for simulated BS date parts
    if (bs.day < 1 || bs.day > 32 || bs.month < 1 || bs.month > 12 || !bs.monthName || bs.year < 2000 || bs.year > 2150) {
      throw new Error("Simulated BS date out of plausible bounds");
    }
    const bsFormatted = `${bs.monthName} ${bs.day}, ${bs.year} BS`;
    return `${bsFormatted} (${adFormatted})`; 
  } catch (error) {
    console.warn('BS date conversion simulation failed:', error, "Input AD Date:", adDate.toISOString());
    // Fallback to only AD date if BS simulation fails significantly
    return `${adFormatted} (AD)`; 
  }
};

export const formatTimestampADBS = (timestampInput?: string | Date): string => {
  if (timestampInput === undefined || timestampInput === '') return 'N/A';

  let adDate: Date;
   if (typeof timestampInput === 'string') {
    adDate = new Date(timestampInput);
  } else {
    adDate = timestampInput instanceof Date ? timestampInput : new Date(timestampInput);
  }
  if (isNaN(adDate.getTime())) return 'Invalid Timestamp';

  const adTimePart = adDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const adDatePart = adDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
  });
  const adFormatted = `${adDatePart} ${adTimePart}`;

  try {
    const bs = adToBsSimulated(adDate);
    if (bs.day < 1 || bs.day > 32 || bs.month < 1 || bs.month > 12 || !bs.monthName || bs.year < 2000 || bs.year > 2150) {
        throw new Error("Simulated BS date out of plausible bounds for timestamp");
    }
    const bsDateFormatted = `${bs.monthName} ${bs.day}, ${bs.year} BS`;
    
    return `${bsDateFormatted}, ${adTimePart} (${adFormatted})`; 
  } catch (error) {
    console.warn('BS date conversion for timestamp failed:', error, "Input AD Timestamp:", adDate.toISOString());
    return `${adFormatted} (AD)`; 
  }
};

// Removed getAdDateStringFromInitialData as it's no longer needed
// The logic is now handled within ContentFormModal's useEffect