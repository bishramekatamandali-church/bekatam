import React, { useEffect, useMemo, useState } from 'react';
import {
  adToBs,
  bsToAd,
  BS_MONTH_NAMES_NP,
  BS_YEAR_RANGE,
  formatADDate,
  formatBSDate,
  getDaysInBsMonth,
  getLocalToday,
  getNepalDateParts,
  getNepalDayOfWeek,
  isSameNepalDay,
  toAdIsoString,
} from '../../dateConverter';
import { BSDate } from '../../types';
import Button from '../ui/Button';

interface DualNepaliCalendarProps {
  initialAdDate?: string; // YYYY-MM-DD
  onDateSelect: (payload: {
    bs: { year: number; month: number; day: number };
    ad: { year: number; month: number; day: number; iso: string };
  }) => void;
  showAdOverlayToggle?: boolean;
}

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-5 h-5'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-5 h-5'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DualNepaliCalendar: React.FC<DualNepaliCalendarProps> = ({
  initialAdDate,
  onDateSelect,
  showAdOverlayToggle = true,
}) => {
  const todayAd = useMemo(() => getLocalToday(), []);
  const todayBs = useMemo(() => adToBs(todayAd), [todayAd]);

  const [currentBsMonth, setCurrentBsMonth] = useState<number>(todayBs.month);
  const [currentBsYear, setCurrentBsYear] = useState<number>(todayBs.year);
  const [selectedBsDate, setSelectedBsDate] = useState<BSDate | null>(null);
  const [showAdOverlay, setShowAdOverlay] = useState(true);

  useEffect(() => {
    if (!initialAdDate) {
      setCurrentBsMonth(todayBs.month);
      setCurrentBsYear(todayBs.year);
      setSelectedBsDate(null);
      return;
    }

    try {
      const adDate = new Date(initialAdDate);
      if (!isNaN(adDate.getTime())) {
        const bsDate = adToBs(adDate);
        setCurrentBsMonth(bsDate.month);
        setCurrentBsYear(bsDate.year);
        setSelectedBsDate(bsDate);
      } else {
        setCurrentBsMonth(todayBs.month);
        setCurrentBsYear(todayBs.year);
        setSelectedBsDate(null);
      }
    } catch (error) {
      console.error('Error parsing initialAdDate for DualNepaliCalendar:', error);
      setCurrentBsMonth(todayBs.month);
      setCurrentBsYear(todayBs.year);
      setSelectedBsDate(null);
    }
  }, [initialAdDate, todayBs]);

  const handlePrevMonth = () => {
    if (currentBsMonth === 1 && currentBsYear === BS_YEAR_RANGE.start) return;
    const newMonth = currentBsMonth === 1 ? 12 : currentBsMonth - 1;
    const newYear = currentBsMonth === 1 ? currentBsYear - 1 : currentBsYear;
    setCurrentBsMonth(newMonth);
    setCurrentBsYear(newYear);
  };

  const handleNextMonth = () => {
    if (currentBsMonth === 12 && currentBsYear === BS_YEAR_RANGE.end) return;
    const newMonth = currentBsMonth === 12 ? 1 : currentBsMonth + 1;
    const newYear = currentBsMonth === 12 ? currentBsYear + 1 : currentBsYear;
    setCurrentBsMonth(newMonth);
    setCurrentBsYear(newYear);
  };

  const handleDayClick = (day: number) => {
    const nextBsDate: BSDate = {
      day,
      month: currentBsMonth,
      year: currentBsYear,
      monthName: BS_MONTH_NAMES_NP[currentBsMonth - 1],
    };
    setSelectedBsDate(nextBsDate);

    const adDate = bsToAd(day, currentBsMonth, currentBsYear);
    const adParts = getNepalDateParts(adDate);

    onDateSelect({
      bs: { year: nextBsDate.year, month: nextBsDate.month, day: nextBsDate.day },
      ad: {
        year: adParts.year,
        month: adParts.month,
        day: adParts.day,
        iso: toAdIsoString(adDate),
      },
    });
  };

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = BS_YEAR_RANGE.start; year <= BS_YEAR_RANGE.end; year++) {
      years.push(year);
    }
    return years;
  }, []);

  const calendarGrid = useMemo(() => {
    const numDaysInMonth = getDaysInBsMonth(currentBsMonth, currentBsYear);
    const firstAdDateOfMonth = bsToAd(1, currentBsMonth, currentBsYear);
    const firstDayOfWeek = getNepalDayOfWeek(firstAdDateOfMonth);

    const daysArray: React.ReactElement[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(
        <div key={`empty-start-${i}`} className="border p-1 h-12 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50" />
      );
    }

    for (let day = 1; day <= numDaysInMonth; day++) {
      const isSelected =
        selectedBsDate?.day === day &&
        selectedBsDate?.month === currentBsMonth &&
        selectedBsDate?.year === currentBsYear;
      const adDateForBsDay = bsToAd(day, currentBsMonth, currentBsYear);
      const adDayLabel = getNepalDateParts(adDateForBsDay).day;
      const isSaturday = getNepalDayOfWeek(adDateForBsDay) === 6;
      const isToday = isSameNepalDay(adDateForBsDay, todayAd);

      daysArray.push(
        <button
          type="button"
          key={day}
          onClick={() => handleDayClick(day)}
          className={`border p-1 h-12 sm:h-14 text-xs text-center focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors
            ${isSelected ? 'bg-purple-600 text-white font-semibold dark:bg-purple-500' : isSaturday ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-800/50'}
            ${isToday && !isSelected ? 'ring-2 ring-amber-500 dark:ring-amber-400' : 'dark:border-slate-600'}
          `}
          aria-pressed={isSelected}
          aria-label={`Select BS ${day}, ${currentBsMonth}, ${currentBsYear}`}
        >
          <span className={`block ${isSelected ? '' : (isSaturday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200')}`}>
            {day}
          </span>
          {showAdOverlay && (
            <span className={`block text-[9px] ${isSelected ? 'text-purple-100 dark:text-purple-200' : (isSaturday ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500')}`}>
              {adDayLabel}
            </span>
          )}
        </button>
      );
    }

    const remainingCells = 7 - (daysArray.length % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        daysArray.push(
          <div key={`empty-end-${i}`} className="border p-1 h-12 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50" />
        );
      }
    }

    return daysArray;
  }, [currentBsMonth, currentBsYear, selectedBsDate, showAdOverlay, todayAd]);

  const selectedLabel = selectedBsDate ? formatBSDate(selectedBsDate) : 'Select a date';
  const selectedAdLabel = selectedBsDate
    ? formatADDate(bsToAd(selectedBsDate.day, selectedBsDate.month, selectedBsDate.year))
    : '';

  return (
    <div className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/30">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedLabel}</p>
          {selectedAdLabel && <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedAdLabel} AD</p>}
        </div>
        {showAdOverlayToggle && (
          <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showAdOverlay}
              onChange={(event) => setShowAdOverlay(event.target.checked)}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            Show AD overlay
          </label>
        )}
      </div>
      <div className="flex justify-between items-center mb-2 px-1">
        <Button type="button" onClick={handlePrevMonth} variant="ghost" size="sm" className="!p-1.5 dark:text-slate-300 dark:hover:bg-slate-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <select
            value={currentBsMonth}
            onChange={(e) => setCurrentBsMonth(parseInt(e.target.value, 10))}
            className="p-1.5 border border-slate-300 dark:border-slate-500 rounded-md text-xs bg-white dark:bg-slate-600 dark:text-slate-200 focus:ring-1 focus:ring-purple-500"
            aria-label="Select BS Month"
          >
            {BS_MONTH_NAMES_NP.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={currentBsYear}
            onChange={(e) => setCurrentBsYear(parseInt(e.target.value, 10))}
            className="p-1.5 border border-slate-300 dark:border-slate-500 rounded-md text-xs bg-white dark:bg-slate-600 dark:text-slate-200 focus:ring-1 focus:ring-purple-500"
            aria-label="Select BS Year"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={handleNextMonth} variant="ghost" size="sm" className="!p-1.5 dark:text-slate-300 dark:hover:bg-slate-700">
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium bg-slate-200 dark:bg-slate-600 border border-slate-200 dark:border-slate-600">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-600 border-x border-b border-slate-200 dark:border-slate-600">
        {calendarGrid}
      </div>
    </div>
  );
};

export default DualNepaliCalendar;
