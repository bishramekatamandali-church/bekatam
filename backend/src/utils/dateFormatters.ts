import fs from "fs";
import path from "path";

const nepaliDateConverterPath = (() => {
  const distPath = path.join(__dirname, "..", "assets", "vendor", "nepali-date-converter.umd.js");
  if (fs.existsSync(distPath)) return distPath;
  return path.join(__dirname, "..", "..", "assets", "vendor", "nepali-date-converter.umd.js");
})();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NepaliDateConverter = require(nepaliDateConverterPath);

export const BS_MONTH_NAMES_NP = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भदौ",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पौष",
  "माघ",
  "फाल्गुण",
  "चैत्र",
];

const BS_MONTH_NAMES_NP_SHORT = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्राव",
  "भदौ",
  "आश्व",
  "कार्त",
  "मंसि",
  "पौष",
  "माघ",
  "फाल्गु",
  "चैत्र",
];

const resolveNepaliDate = (): any => NepaliDateConverter?.default ?? NepaliDateConverter;

const resolveBsMonthIndex = (bs: any): number => {
  const rawMonth = bs.getMonth?.();
  if (rawMonth === undefined || rawMonth === null || Number.isNaN(rawMonth)) return 0;
  if (rawMonth === 0) return 0;
  if (rawMonth > 11) return rawMonth - 1;
  return rawMonth;
};

const formatBSDate = (bs: any): string => {
  const monthName = BS_MONTH_NAMES_NP[resolveBsMonthIndex(bs)] ?? "";
  return `${monthName} ${bs.getDate?.() ?? ""}, ${bs.getYear?.() ?? ""} BS`.trim();
};

const padTwo = (value: number): string => String(value).padStart(2, "0");

const AD_MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatADShort = (adDate: Date): string => {
  const monthName = AD_MONTH_SHORT[adDate.getMonth()] ?? "";
  const day = padTwo(adDate.getDate());
  return `${monthName} - ${day} - ${adDate.getFullYear()}`;
};

const formatBSShort = (bs: any): string => {
  const monthName = BS_MONTH_NAMES_NP_SHORT[resolveBsMonthIndex(bs)] ?? "";
  const day = padTwo(bs.getDate?.() ?? 0);
  const year = bs.getYear?.() ?? "";
  return `${monthName} - ${day} - ${year}`.trim();
};

export const formatDateADBS = (dateInput?: string | Date): string => {
  if (!dateInput) return "";
  const parsed = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "";

  const adFormatted = parsed.toISOString().slice(0, 10);

  try {
    const NepaliDate = resolveNepaliDate();
    if (!NepaliDate?.fromAD) throw new Error("NepaliDate.fromAD not available");
    const bs = NepaliDate.fromAD(parsed);
    const bsFormatted = formatBSDate(bs);
    return bsFormatted ? `${bsFormatted} (${adFormatted})` : adFormatted;
  } catch (error) {
    console.warn("BS date conversion failed:", error);
    return `${adFormatted} (AD)`;
  }
};

export const formatDateADBSShort = (dateInput?: string | Date): string => {
  if (!dateInput) return "";
  const parsed = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "";

  try {
    const NepaliDate = resolveNepaliDate();
    if (!NepaliDate?.fromAD) throw new Error("NepaliDate.fromAD not available");
    const bs = NepaliDate.fromAD(parsed);
    const bsFormatted = formatBSShort(bs);
    const adFormatted = formatADShort(parsed);
    return bsFormatted ? `${bsFormatted} (${adFormatted})` : adFormatted;
  } catch (error) {
    console.warn("BS date conversion failed:", error);
    return formatADShort(parsed);
  }
};

export const getBsDateParts = (dateInput?: string | Date): { year: number; month: number; day: number } | null => {
  if (!dateInput) return null;
  const parsed = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return null;

  try {
    const NepaliDate = resolveNepaliDate();
    if (!NepaliDate?.fromAD) throw new Error("NepaliDate.fromAD not available");
    const bs = NepaliDate.fromAD(parsed);
    return {
      year: bs.getYear?.() ?? 0,
      month: (bs.getMonth?.() ?? 0) + 1,
      day: bs.getDate?.() ?? 0,
    };
  } catch (error) {
    console.warn("BS date conversion failed:", error);
    return null;
  }
};
