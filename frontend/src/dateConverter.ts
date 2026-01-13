// dateConverter.ts
import { BSDate } from './types';
import { BS_CALENDAR_DATA } from './utils/bsCalendarData';

const BS_START_YEAR = BS_CALENDAR_DATA[0][0];
const BS_END_YEAR = BS_CALENDAR_DATA[BS_CALENDAR_DATA.length - 1][0];
const BS_START_MONTH = 1;
const BS_START_DAY = 1;
const NEPAL_TIME_ZONE = 'Asia/Kathmandu';
// Calibration offset so the normalized calendar data matches the current reference date.
const BS_CALENDAR_DAY_OFFSET = 2;

export const BS_MONTH_NAMES_EN = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra',
  'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh',
  'Falgun', 'Chaitra'
];

export const BS_YEAR_RANGE = { start: BS_START_YEAR, end: BS_END_YEAR } as const;

// Useful reference for UI logic that still relies on the rough year gap.
export const AD_BS_YEAR_DIFF = 56;


// BS 2000-01-01 corresponds to 1943-04-14 AD.
const AD_EPOCH_DATE = new Date(Date.UTC(1943, 3, 14));

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const BIKRAM_FORMAT_LOCALES = ['en-NP-u-ca-bikram', 'ne-NP-u-ca-bikram'];

const getBikramFormatter = (() => {
  let cached: Intl.DateTimeFormat | null | undefined;
  return (): Intl.DateTimeFormat | null => {
    if (cached !== undefined) {
      return cached;
    }
    cached = null;
    for (const locale of BIKRAM_FORMAT_LOCALES) {
      const formatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'UTC',
      });
      if (formatter.resolvedOptions().calendar === 'bikram') {
        cached = formatter;
        break;
      }
    }
    return cached;
  };
})();

const bsMonthDaysMap = new Map<number, number[]>(
  BS_CALENDAR_DATA.map(row => [row[0], row.slice(1)])
);

const isGregorianLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const isLikelyBsLeapYear = (bsYear: number): boolean => {
  const adYear = bsYear - AD_BS_YEAR_DIFF;
  return isGregorianLeapYear(adYear);
};

const getNormalizedBsMonthDays = (bsYear: number): number[] | null => {
  const months = bsMonthDaysMap.get(bsYear);
  if (!months) return null;

  const normalized = [...months];
  const total = normalized.reduce((sum, days) => sum + days, 0);
  const missingDays = total < 365 ? 365 - total : 0;
  const leapAdjustment = isLikelyBsLeapYear(bsYear) ? 1 : 0;
  normalized[normalized.length - 1] += missingDays + leapAdjustment;
  return normalized;
};

const getBsPartsFromIntl = (adDate: Date): { year: number; month: number; day: number } | null => {
  const formatter = getBikramFormatter();
  if (!formatter) return null;

  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  for (const part of formatter.formatToParts(adDate)) {
    if (part.type === 'year') year = Number(part.value);
    if (part.type === 'month') month = Number(part.value);
    if (part.type === 'day') day = Number(part.value);
  }

  if (year === null || month === null || day === null) {
    return null;
  }

  return { year, month, day };
};

const makeBsKey = (year: number, month: number, day: number) => `${year}-${month}-${day}`;

const getBsToAdCache = (() => {
  let cache: Map<string, Date> | null | undefined;
  return (): Map<string, Date> | null => {
    if (cache !== undefined) {
      return cache;
    }

    const formatter = getBikramFormatter();
    if (!formatter) {
      cache = null;
      return cache;
    }

    const map = new Map<string, Date>();
    const start = Date.UTC(1943, 0, 1);
    const end = Date.UTC(2035, 11, 31);

    for (let timestamp = start; timestamp <= end; timestamp += DAY_IN_MS) {
      const adDate = new Date(timestamp);
      const bsParts = getBsPartsFromIntl(adDate);
      if (!bsParts) continue;
      map.set(makeBsKey(bsParts.year, bsParts.month, bsParts.day), adDate);
    }

    cache = map;
    return cache;
  };
})();

export const getDaysInBsMonth = (bsMonth: number, bsYear: number): number => {
  const months = getNormalizedBsMonthDays(bsYear);
  if (!months || bsMonth < 1 || bsMonth > 12) {
    throw new Error(`Invalid BS date (${bsYear}-${bsMonth}). Supported years: ${BS_START_YEAR}-${BS_END_YEAR}`);
  }
  return months[bsMonth - 1];
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

const normalizeToUtcDate = (dateInput: string | Date): Date => {
  const parsed = (() => {
    if (typeof dateInput !== 'string') {
      return new Date(dateInput);
    }
    if (dateInput.includes('T')) {
      return new Date(dateInput);
    }
    return new Date(`${dateInput}T00:00:00`);
  })();
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date input: ${dateInput}`);
  }
  const parts = getDatePartsInTimeZone(parsed, NEPAL_TIME_ZONE);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

export const getLocalToday = (): Date => {
  const parts = getDatePartsInTimeZone(new Date(), NEPAL_TIME_ZONE);
  return new Date(parts.year, parts.month - 1, parts.day);
};

export const adToBs = (adDateInput: string | Date): BSDate => {
  const adDate = normalizeToUtcDate(adDateInput);
  const intlParts = getBsPartsFromIntl(adDate);
  if (intlParts) {
    return {
      year: intlParts.year,
      month: intlParts.month,
      day: intlParts.day,
      monthName: BS_MONTH_NAMES_EN[intlParts.month - 1],
      dayOfWeek: adDate.getUTCDay(),
    };
  }

  const diffDays = Math.floor((adDate.getTime() - AD_EPOCH_DATE.getTime()) / DAY_IN_MS) + BS_CALENDAR_DAY_OFFSET;

  if (diffDays < 0) {
    throw new Error('AD date is before supported BS calendar range.');
  }

  let remainingDays = diffDays;
  let bsYear = BS_START_YEAR;
  let bsMonth = BS_START_MONTH;
  let bsDay = BS_START_DAY;

  while (remainingDays > 0) {
    const daysInCurrentMonth = getDaysInBsMonth(bsMonth, bsYear);
    bsDay++;
    if (bsDay > daysInCurrentMonth) {
      bsDay = 1;
      bsMonth++;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear++;
        if (bsYear > BS_END_YEAR) {
          throw new Error('AD date exceeds supported BS calendar range.');
        }
      }
    }
    remainingDays--;
  }

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthName: BS_MONTH_NAMES_EN[bsMonth - 1],
    dayOfWeek: adDate.getUTCDay(),
  };
};

export const bsToAd = (bsDay: number, bsMonth: number, bsYear: number): Date => {
  if (bsYear < BS_START_YEAR || bsYear > BS_END_YEAR) {
    throw new Error(`BS year ${bsYear} out of supported range (${BS_START_YEAR}-${BS_END_YEAR}).`);
  }
  if (bsMonth < 1 || bsMonth > 12) throw new Error('BS month must be between 1 and 12.');
  if (bsDay < 1 || bsDay > getDaysInBsMonth(bsMonth, bsYear)) {
    throw new Error('BS day is out of range for the provided month/year.');
  }

  const cache = getBsToAdCache();
  if (cache) {
    const key = makeBsKey(bsYear, bsMonth, bsDay);
    const cachedAd = cache.get(key);
    if (cachedAd) {
      return new Date(cachedAd.getTime() + 12 * 60 * 60 * 1000);
    }
  }

  let totalDays = 0;

  for (let year = BS_START_YEAR; year < bsYear; year++) {
    const months = getNormalizedBsMonthDays(year);
    if (!months) {
      throw new Error(`Missing BS calendar data for year ${year}.`);
    }
    totalDays += months.reduce((sum, days) => sum + days, 0);
  }

  const monthsForYear = getNormalizedBsMonthDays(bsYear);
  if (!monthsForYear) {
    throw new Error(`Missing BS calendar data for year ${bsYear}.`);
  }
  for (let monthIndex = 0; monthIndex < bsMonth - 1; monthIndex++) {
    totalDays += monthsForYear[monthIndex];
  }

  totalDays += bsDay - 1;
  totalDays = Math.max(0, totalDays - BS_CALENDAR_DAY_OFFSET);

  // Use midday UTC to avoid timezone rollbacks that can shift the displayed AD date.
  const utcMillis = AD_EPOCH_DATE.getTime() + totalDays * DAY_IN_MS;
  return new Date(utcMillis + 12 * 60 * 60 * 1000);
};

// Backwards-compatible exports for existing imports
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

export const formatDateADBS = (dateInput?: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (dateInput === undefined || dateInput === '') return 'N/A';

  let adDate: Date;
  try {
    adDate = normalizeToUtcDate(dateInput);
  } catch (error) {
    console.warn(error);
    return 'Invalid Date';
  }

  const adOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  const adFormatted = adDate.toLocaleDateString('en-US', adOptions);

  try {
    const bs = adToBs(adDate);
    const bsFormatted = `${bs.monthName} ${bs.day}, ${bs.year} BS`;
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
    adDate = normalizeToUtcDate(timestampInput);
  } catch (error) {
    console.warn(error);
    return 'Invalid Timestamp';
  }

  const adTimePart = adDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const adDatePart = adDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const adFormatted = `${adDatePart} ${adTimePart}`;

  try {
    const bs = adToBs(adDate);
    const bsDateFormatted = `${bs.monthName} ${bs.day}, ${bs.year} BS`;
    return `${bsDateFormatted}, ${adTimePart} (${adFormatted})`;
  } catch (error) {
    console.warn('BS date conversion for timestamp failed:', error);
    return `${adFormatted} (AD)`;
  }
};
