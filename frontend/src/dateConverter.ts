import { BSDate } from './types';
import nepaliDateConverter from "nepali-date-converter";

const resolveNepaliDate = (): any =>
  (nepaliDateConverter as any)?.default ?? nepaliDateConverter;

const NepaliDate = resolveNepaliDate();

export function adToBsParts(ad: Date) {
  const bs = NepaliDate.fromAD(ad);

  return {
    year: bs.getYear(),
    month: bs.getMonth() + 1,
    day: bs.getDate(),
  };
}

const NEPAL_TIME_ZONE = 'Asia/Kathmandu';

export const BS_MONTH_NAMES_NP = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भदौ',
  'आश्विन', 'कार्तिक', 'मंसिर', 'पौष', 'माघ',
  'फाल्गुण', 'चैत्र'
];

export const BS_MONTH_NAMES_EN = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra',
  'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh',
  'Falgun', 'Chaitra'
];

export const BS_YEAR_RANGE = { start: 2000, end: 2090 } as const;

type DateParts = { year: number; month: number; day: number };

const padNumber = (value: number): string => value.toString().padStart(2, '0');

type DateConverter = {
  adToBs: (date: string) => DateParts;
  bsToAd: (year: number, month: number, day: number) => DateParts;
};

let cachedConverter: DateConverter | null = null;
let hasLoggedConverterError = false;

const parseDateInput = (dateInput: string | Date): Date => {
  if (typeof dateInput !== 'string') {
    return new Date(dateInput);
  }
  if (dateInput.includes('T')) {
    return new Date(dateInput);
  }
  return new Date(`${dateInput}T00:00:00Z`);
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const getLocalDateParts = (date: Date): DateParts => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

const fallbackConverter: DateConverter = {
  adToBs: (date: string) => {
     const parsed = parseDateInput(date);
    if (isNaN(parsed.getTime())) {
      return { year: 0, month: 0, day: 0 };
    }
    return getDatePartsInTimeZone(parsed, NEPAL_TIME_ZONE);
  },
  bsToAd: (year: number, month: number, day: number) => ({ year, month, day }),
};

const resolveDateConverter = (): DateConverter => {
  if (cachedConverter) return cachedConverter;

  // ✅ nepali-date-converter exports:
  // { dateConfigMap, default: NepaliDate }
  const NepaliDate = resolveNepaliDate();

  if (!NepaliDate) {
    throw new Error("NepaliDate default export not found in nepali-date-converter");
  }

  cachedConverter = {
  adToBs: (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    const ad = new Date(Date.UTC(y, m - 1, d));
    const bs = NepaliDate.fromAD(ad);

    return {
      year: bs.getYear(),
      month: bs.getMonth() + 1,
      day: bs.getDate(),
    };
  },

  bsToAd: (year: number, month: number, day: number) => {
    const bs = new NepaliDate(year, month - 1, day); // month is 0-based
    const ad = bs.toJsDate(); // ✅ confirmed method
    const adParts = getDatePartsInTimeZone(ad, NEPAL_TIME_ZONE);

    return {
      year: adParts.year,
      month: adParts.month,
      day: adParts.day,
    };
  },
};

return cachedConverter;
};

const getDateConverter = (): DateConverter => {
  try {
    return resolveDateConverter();
  } catch (error) {
    if (!hasLoggedConverterError) {
      console.error('Falling back to AD-only date conversion.', error);
      hasLoggedConverterError = true;
    }
    return fallbackConverter;
  }
};

const getDatePartsInTimeZone = (date: Date, timeZone: string): { year: number; month: number; day: number } => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  for (const part of formatter.formatToParts(date)) {
    if (part.type === 'year') year = Number(part.value);
    if (part.type === 'month') month = Number(part.value);
    if (part.type === 'day') day = Number(part.value);
  }

  if (year === null || month === null || day === null) {
    throw new Error('Unable to resolve date parts for timezone conversion.');
  }

  return { year, month, day };
};

const getAdDateParts = (dateInput: string | Date, timeZone?: string): DateParts => {
  if (typeof dateInput === 'string') {
    const isoMatch = ISO_DATE_PATTERN.exec(dateInput);
    if (isoMatch) {
      return {
        year: Number(isoMatch[1]),
        month: Number(isoMatch[2]),
        day: Number(isoMatch[3]),
      };
    }
  }

  const parsed = parseDateInput(dateInput);

  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date input: ${dateInput}`);
  }

  if (timeZone) {
    return getDatePartsInTimeZone(parsed, timeZone);
  }

  return getLocalDateParts(parsed);
};

const formatIsoDate = (year: number, month: number, day: number): string =>
  `${year}-${padNumber(month)}-${padNumber(day)}`;

export const getNepalDateParts = (date: Date): { year: number; month: number; day: number } =>
  getDatePartsInTimeZone(date, NEPAL_TIME_ZONE);

export const getNepalDayOfWeek = (date: Date): number => {
  const parts = getNepalDateParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
};

export const isSameNepalDay = (a: Date, b: Date): boolean => {
  const aParts = getNepalDateParts(a);
  const bParts = getNepalDateParts(b);
  return aParts.year === bParts.year && aParts.month === bParts.month && aParts.day === bParts.day;
};

export const getLocalToday = (): Date => {
  const parts = getDatePartsInTimeZone(new Date(), NEPAL_TIME_ZONE);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

const adToBsWithTimeZone = (adDateInput: string | Date, timeZone?: string): BSDate => {
  const parts = getAdDateParts(adDateInput, timeZone);
  const isoDate = formatIsoDate(parts.year, parts.month, parts.day);
  const { adToBs: libAdToBs } = getDateConverter();
  const bs = libAdToBs(isoDate);

  return {
    year: bs.year,
    month: bs.month,
    day: bs.day,
    monthName: BS_MONTH_NAMES_NP[bs.month - 1] ?? BS_MONTH_NAMES_EN[bs.month - 1],
    dayOfWeek: new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(),
  };
};

export const adToBs = (adDateInput: string | Date): BSDate =>
  adToBsWithTimeZone(adDateInput, NEPAL_TIME_ZONE);

export const bsToAd = (bsDay: number, bsMonth: number, bsYear: number): Date => {
  if (bsYear < BS_YEAR_RANGE.start || bsYear > BS_YEAR_RANGE.end) {
    throw new Error(`BS year ${bsYear} out of supported range (${BS_YEAR_RANGE.start}-${BS_YEAR_RANGE.end}).`);
  }
  if (bsMonth < 1 || bsMonth > 12) throw new Error('BS month must be between 1 and 12.');

  const { bsToAd: libBsToAd } = getDateConverter();
  const ad = libBsToAd(bsYear, bsMonth, bsDay);
  return new Date(Date.UTC(ad.year, ad.month - 1, ad.day));
};

export const getDaysInBsMonth = (bsMonth: number, bsYear: number): number => {
  if (bsMonth < 1 || bsMonth > 12) {
    throw new Error('BS month must be between 1 and 12.');
  }
  if (bsYear < BS_YEAR_RANGE.start || bsYear > BS_YEAR_RANGE.end) {
    throw new Error(`BS year ${bsYear} out of supported range (${BS_YEAR_RANGE.start}-${BS_YEAR_RANGE.end}).`);
  }

  if (bsMonth === 12 && bsYear === BS_YEAR_RANGE.end) {
    for (let day = 32; day >= 28; day--) {
      try {
        bsToAd(day, bsMonth, bsYear);
        return day;
      } catch (error) {
        continue;
      }
    }
  }

  const startDate = bsToAd(1, bsMonth, bsYear);
  const nextMonth = bsMonth === 12 ? 1 : bsMonth + 1;
  const nextYear = bsMonth === 12 ? bsYear + 1 : bsYear;
  const endDate = bsToAd(1, nextMonth, nextYear);

  const dayInMs = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / dayInMs);
};

export type DateConversionPayload =
  | { direction: 'AD_TO_BS'; adDate: string | Date }
  | { direction: 'BS_TO_AD'; bsDay: number; bsMonth: number; bsYear: number };

export const convertDate = (payload: DateConversionPayload): { bsDate?: BSDate; adDate?: Date } => {
  if (payload.direction === 'AD_TO_BS') {
    return { bsDate: adToBs(payload.adDate) };
  }

  return {
    adDate: bsToAd(payload.bsDay, payload.bsMonth, payload.bsYear),
  };
};

export const formatBSDate = (bsDate: BSDate, withSuffix = true): string => {
  const monthName = BS_MONTH_NAMES_NP[bsDate.month - 1] ?? BS_MONTH_NAMES_EN[bsDate.month - 1];
  return `${monthName} ${bsDate.day}, ${bsDate.year}${withSuffix ? ' BS' : ''}`;
};

export const formatADDate = (
  adDate: Date,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string => new Intl.DateTimeFormat('en-US', { ...options, timeZone: NEPAL_TIME_ZONE }).format(adDate);

export const toAdIsoString = (adDate: Date): string => {
  const parts = getNepalDateParts(adDate);
  return formatIsoDate(parts.year, parts.month, parts.day);
};

export const formatDateADBS = (dateInput?: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (dateInput === undefined || dateInput === '') return 'N/A';

  let adDate: Date;
  try {
    const parts = getAdDateParts(dateInput);
    adDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  } catch (error) {
    console.warn(error);
    return 'Invalid Date';
  }

  const adFormatted = formatADDate(adDate, options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  try {
    const bs = adToBs(adDate);
    const bsFormatted = formatBSDate(bs);
    return `${bsFormatted} (${adFormatted})`;
  } catch (error) {
    console.warn('BS date conversion failed:', error);
    return `${adFormatted} (AD)`;
  }
};

export const formatTimestampADBS = (timestampInput?: string | Date): string => {
  if (timestampInput === undefined || timestampInput === '') return 'N/A';

  let adDate: Date;
  try {
    const parsed = typeof timestampInput === 'string' ? new Date(timestampInput) : new Date(timestampInput);
    if (isNaN(parsed.getTime())) throw new Error('Invalid timestamp');
    adDate = parsed;
  } catch (error) {
    console.warn(error);
    return 'Invalid Timestamp';
  }

  const adTimePart = new Intl.DateTimeFormat('en-US', {
    timeZone: NEPAL_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(adDate);
  const adDatePart = formatADDate(adDate, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const adFormatted = `${adDatePart} ${adTimePart}`;

  try {
    const bs = adToBsWithTimeZone(adDate, NEPAL_TIME_ZONE);
    const bsDateFormatted = formatBSDate(bs);
    return `${bsDateFormatted}, ${adTimePart} (${adFormatted})`;
  } catch (error) {
    console.warn('BS date conversion for timestamp failed:', error);
    return `${adFormatted} (AD)`;
  }
};

export const toBS = (adDateInput: Date | string): BSDate => adToBs(adDateInput);

export const toAD = (bsDate: BSDate): { year: number; month: number; day: number; iso: string } => {
  const adDate = bsToAd(bsDate.day, bsDate.month, bsDate.year);
  const parts = getNepalDateParts(adDate);
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    iso: formatIsoDate(parts.year, parts.month, parts.day),
  };
};

export const formatBS = (bsDate: BSDate): string => formatBSDate(bsDate);
export const formatAD = (adDate: Date | string): string => {
  const parsed = typeof adDate === 'string' ? new Date(adDate) : adDate;
  return formatADDate(parsed, { year: 'numeric', month: 'short', day: 'numeric' });
};
