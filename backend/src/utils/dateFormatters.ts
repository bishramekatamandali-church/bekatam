import fs from "fs";
import path from "path";

const nepaliDateConverterPath = (() => {
  const distPath = path.join(__dirname, "..", "assets", "vendor", "nepali-date-converter.umd.js");
  if (fs.existsSync(distPath)) return distPath;
  return path.join(__dirname, "..", "..", "assets", "vendor", "nepali-date-converter.umd.js");
})();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NepaliDateConverter = require(nepaliDateConverterPath);

const BS_MONTH_NAMES_NP = [
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

const resolveNepaliDate = (): any => NepaliDateConverter?.default ?? NepaliDateConverter;

const formatBSDate = (bs: any): string => {
  const monthName = BS_MONTH_NAMES_NP[bs.getMonth?.() ?? 0] ?? "";
  return `${monthName} ${bs.getDate?.() ?? ""}, ${bs.getYear?.() ?? ""} BS`.trim();
};

const padTwo = (value: number): string => String(value).padStart(2, "0");

const formatADShort = (adDate: Date): string => {
  const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(adDate);
  const day = padTwo(adDate.getDate());
  return `${monthName} - ${day} - ${adDate.getFullYear()}`;
};

const formatBSShort = (bs: any): string => {
  const monthName = BS_MONTH_NAMES_NP[bs.getMonth?.() ?? 0] ?? "";
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
