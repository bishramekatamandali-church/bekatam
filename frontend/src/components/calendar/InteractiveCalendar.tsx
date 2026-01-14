
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  adToBs,
  bsToAd,
  BS_MONTH_NAMES_NP,
  BS_YEAR_RANGE,
  formatADDate,
  getDaysInBsMonth,
  getLocalToday,
  getNepalDateParts,
  getNepalDayOfWeek,
  isSameNepalDay,
  toAdIsoString,
} from '../../dateConverter';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
);

export type CalendarEntryType = 'event' | 'news' | 'sermon' | 'blog';

export interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  type: CalendarEntryType;
  link?: string;
}

const BS_MONTH_NAMES_SHORT = [
  "बैशाख","जेठ","असार","श्रावण","भाद्र","आश्विन","कार्तिक","मंसिर","पौष","माघ","फाल्गुन","चैत्र"
];

const getAdDateKey = (date: Date): string => {
  const parts = getNepalDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const DAY_LABELS = [
  { en: "Sun", np: "आइत" },
  { en: "Mon", np: "सोम" },
  { en: "Tue", np: "मंगल" },
  { en: "Wed", np: "बुध" },
  { en: "Thu", np: "बिही" },
  { en: "Fri", np: "शुक्र" },
  { en: "Sat", np: "शनि" },
];

const TYPE_COLORS: Record<CalendarEntryType, string> = {
  event: 'bg-teal-500',
  news: 'bg-amber-500',
  sermon: 'bg-purple-500',
  blog: 'bg-blue-500',
};


interface InteractiveCalendarProps {
  items: CalendarEntry[];
  onMonthChange?: (bsMonth: number, bsYear: number) => void;
  initialBsMonth?: number;
  initialBsYear?: number;
}

const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({ items, onMonthChange, initialBsMonth, initialBsYear }) => {
  const defaultInitialAdDate = useMemo(() => getLocalToday(), []);
  const defaultInitialBsDate = useMemo(() => adToBs(defaultInitialAdDate), [defaultInitialAdDate]);

  const [currentBsMonth, setCurrentBsMonth] = useState<number>(initialBsMonth || defaultInitialBsDate.month);
  const [currentBsYear, setCurrentBsYear] = useState<number>(initialBsYear || defaultInitialBsDate.year);
  
  const [selectedBsDate, setSelectedBsDate] = useState<BSDate | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<CalendarEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDateLabel, setModalDateLabel] = useState('');

  useEffect(() => {
    if (initialBsMonth !== undefined && initialBsMonth !== currentBsMonth) {
      setCurrentBsMonth(initialBsMonth);
    }
    if (initialBsYear !== undefined && initialBsYear !== currentBsYear) {
      setCurrentBsYear(initialBsYear);
    }
  }, [initialBsMonth, initialBsYear, currentBsMonth, currentBsYear]);

  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentBsMonth, currentBsYear);
    }
  }, [currentBsMonth, currentBsYear, onMonthChange]);
  
useEffect(() => {
    setSelectedBsDate(null);
    setSelectedEntries([]);
    setIsModalOpen(false);
  }, [currentBsMonth, currentBsYear]);

  const handlePrevMonth = () => {
    if (currentBsMonth === 1 && currentBsYear === BS_YEAR_RANGE.start) return;

    let newMonth = currentBsMonth - 1;
    let newYear = currentBsYear;

    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newYear < BS_YEAR_RANGE.start) { newYear = BS_YEAR_RANGE.start; newMonth = 1; }

    setCurrentBsMonth(newMonth);
    setCurrentBsYear(newYear);
  };

  const handleNextMonth = () => {
    if (currentBsMonth === 12 && currentBsYear === BS_YEAR_RANGE.end) return;

    let newMonth = currentBsMonth + 1;
    let newYear = currentBsYear;

    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newYear > BS_YEAR_RANGE.end) { newYear = BS_YEAR_RANGE.end; newMonth = 12; }

    setCurrentBsMonth(newMonth);
    setCurrentBsYear(newYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentBsYear(parseInt(e.target.value, 10));
  };

  const goToToday = () => {
    const todayAd = getLocalToday();
    const todayBs = adToBs(todayAd);
    setCurrentBsMonth(todayBs.month);
    setCurrentBsYear(todayBs.year);
    setSelectedBsDate(todayBs);
    setIsModalOpen(false);
  };
  
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = BS_YEAR_RANGE.start; year <= BS_YEAR_RANGE.end; year++) {
      years.push(year);
    }
    return years;
  }, []);

  const formatBsYearLabel = useCallback((bsYear: number) => {
    const startAdYear = getNepalDateParts(bsToAd(1, 1, bsYear)).year;
    const lastDayInYear = getDaysInBsMonth(12, bsYear);
    const endAdYear = getNepalDateParts(bsToAd(lastDayInYear, 12, bsYear)).year;
    return startAdYear === endAdYear ? `${startAdYear} AD` : `${startAdYear}-${endAdYear} AD`;
  }, []);

const formatBsYearOptionLabel = useCallback((bsYear: number) => {
    return `${bsYear} BS (${formatBsYearLabel(bsYear)})`;
  }, [formatBsYearLabel]);

  const currentBsYearAdLabel = useMemo(() => formatBsYearLabel(currentBsYear), [currentBsYear, formatBsYearLabel]);
  const currentBsMonthAdRangeLabel = useMemo(() => {
    try {
      const startAdDate = bsToAd(1, currentBsMonth, currentBsYear);
      const endAdDay = getDaysInBsMonth(currentBsMonth, currentBsYear);
      const endAdDate = bsToAd(endAdDay, currentBsMonth, currentBsYear);
      const startAdDateNormalized = new Date(`${toAdIsoString(startAdDate)}T00:00:00Z`);
      const endAdDateNormalized = new Date(`${toAdIsoString(endAdDate)}T00:00:00Z`);

      const startRoundTrip = adToBs(startAdDateNormalized);
      const endRoundTrip = adToBs(endAdDateNormalized);
      const isStartValid = startRoundTrip.year === currentBsYear && startRoundTrip.month === currentBsMonth && startRoundTrip.day === 1;
      const isEndValid = endRoundTrip.year === currentBsYear && endRoundTrip.month === currentBsMonth && endRoundTrip.day === endAdDay;

      if (!isStartValid || !isEndValid) {
        throw new Error('BS/AD conversion mismatch detected.');
      }

      const startParts = getNepalDateParts(startAdDateNormalized);
      const endParts = getNepalDateParts(endAdDateNormalized);
      const startLabel = formatADDate(startAdDateNormalized, {
        month: 'short',
        day: 'numeric',
        ...(startParts.year !== endParts.year ? { year: 'numeric' } : {}),
      });
      const endLabel = formatADDate(endAdDateNormalized, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${startLabel} - ${endLabel} AD`;
    } catch (error) {
      console.warn('Unable to resolve AD range for BS month:', error);
      return 'AD range unavailable';
    }
  }, [currentBsMonth, currentBsYear]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    items.forEach(item => {
      if (!item.date) return;
      const adDate = new Date(item.date);
      if (isNaN(adDate.getTime())) return;
      const key = getAdDateKey(adDate);
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    });
    return map;
  }, [items]);
  
  const calendarGrid = useMemo(() => {
    const numDaysInMonth = getDaysInBsMonth(currentBsMonth, currentBsYear);
    const firstAdDateOfMonth = bsToAd(1, currentBsMonth, currentBsYear);
    const firstDayOfWeek = getNepalDayOfWeek(firstAdDateOfMonth);

    // FIX: Changed JSX.Element[] to React.ReactElement[] to resolve "Cannot find namespace 'JSX'" error.
    const days: React.ReactElement[] = [];

    // Leading blanks
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <div key={`empty-start-${i}`} className="border-r border-b border-blue-200 bg-slate-50 aspect-square"></div>
      );
    }

    // Actual days
    for (let day = 1; day <= numDaysInMonth; day++) {
      const adDateForBsDay = bsToAd(day, currentBsMonth, currentBsYear);
      const isToday = isSameNepalDay(adDateForBsDay, defaultInitialAdDate);
      const isSelectedDay = selectedBsDate?.day === day && selectedBsDate?.month === currentBsMonth && selectedBsDate?.year === currentBsYear;
      
      const entriesOnDay = itemsByDate.get(getAdDateKey(adDateForBsDay)) ?? [];

      const isSaturday = getNepalDayOfWeek(adDateForBsDay) === 6;

      days.push(
        <div
          key={day}
          className={`relative border-r border-b border-blue-200 p-1.5 cursor-pointer hover:bg-blue-50 transition-colors duration-150 flex flex-col justify-between aspect-square
            ${isSaturday ? 'bg-green-50' : 'bg-white'} 
            ${isSelectedDay ? 'bg-purple-200 ring-2 ring-purple-500' : isToday ? 'ring-2 ring-amber-500' : ''}`}
          onClick={() => {
            const bsDate = { day, month: currentBsMonth, year: currentBsYear, monthName: BS_MONTH_NAMES_NP[currentBsMonth - 1] };
            setSelectedBsDate(bsDate);
            if (entriesOnDay.length > 0) {
              const adLabel = `${formatADDate(adDateForBsDay)} AD`;
              setModalDateLabel(`${bsDate.monthName} ${bsDate.day}, ${bsDate.year} BS • ${adLabel}`);
              setSelectedEntries(entriesOnDay);
              setIsModalOpen(true);
            } else {
              setIsModalOpen(false);
              setSelectedEntries([]);
            }
          }}
          role="button" tabIndex={0}
          aria-label={`View events for BS ${day}, ${BS_MONTH_NAMES_NP[currentBsMonth - 1]} ${currentBsYear}`}
        >
          {/* AD small number */}
          <span className={`absolute top-1 right-1 text-[9px] sm:text-[10px] md:text-xs ${isSelectedDay ? 'text-purple-600' : (isSaturday ? 'text-green-500' : 'text-slate-400')}`}>
            {getNepalDateParts(adDateForBsDay).day}
          </span>
          
          {/* BS big number */}
          <div className="flex-grow flex items-center justify-center">
            <span className={`font-bold text-base sm:text-lg md:text-xl lg:text-2xl ${isSelectedDay ? 'text-purple-800' : (isSaturday ? 'text-green-700' : 'text-slate-700')}`}>
              {day}
            </span>
          </div>

          {/* Events */}
          {entriesOnDay.length > 0 && (
            <div className="flex justify-center items-end space-x-1 h-4">
              {entriesOnDay.slice(0, 4).map(entry => (
                <div key={entry.id} className="relative group">
                  <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[entry.type]}`}></div>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 transform-gpu text-center" role="tooltip">
                    {entry.title}
                  </div>
                </div>
              ))}
              {entriesOnDay.length > 4 && <div className="text-xs text-teal-600">+</div>}
            </div>
          )}
        </div>
      );
    }

    // Fill up to 42 cells (6 weeks)
    const totalCells = 42;
    while(days.length < totalCells) {
        days.push(<div key={`empty-fill-${days.length}`} className="border-r border-b border-blue-200 bg-slate-50 aspect-square"></div>);
    }

    return days;
  }, [currentBsMonth, currentBsYear, itemsByDate, defaultInitialAdDate, selectedBsDate]);
  
  const currentMonthNameShort = BS_MONTH_NAMES_SHORT[currentBsMonth - 1] || BS_MONTH_NAMES_NP[currentBsMonth - 1];

  return (
    <div className="bg-white rounded-t-lg">
      <header className="bg-blue-600 text-white p-3 flex flex-col gap-3 rounded-t-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button onClick={handlePrevMonth} variant="ghost" size="sm" className="!p-2 !text-white hover:!bg-blue-500" aria-label="Previous Month">
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <Button onClick={goToToday} variant="ghost" size="sm" className="!px-2.5 !py-0.5 text-xs font-semibold !text-white hover:!bg-blue-500 border border-white/50 rounded-full" aria-label="Jump to today">
            Today
          </Button>
          <Button onClick={handleNextMonth} variant="ghost" size="sm" className="!p-2 !text-white hover:!bg-blue-500" aria-label="Next Month">
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 bg-blue-500/40 px-2.5 py-1 rounded-md">
            <label htmlFor="calendar-year" className="text-xs uppercase tracking-wide text-blue-100">Year</label>
            <select
              id="calendar-year"
              value={currentBsYear}
              onChange={handleYearChange}
              className="bg-blue-500 border border-blue-400 text-white text-xs rounded-md px-2 py-1 focus:ring-amber-500 focus:border-amber-500 min-w-[150px] text-center"
              aria-label="Select Year"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {formatBsYearOptionLabel(year)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold tracking-wide">
            {currentMonthNameShort} {currentBsYear} BS
          </h2>
          <p className="text-xs text-blue-100">{currentBsMonthAdRangeLabel}</p>
          <p className="text-[11px] text-blue-200">{currentBsYearAdLabel}</p>

        </div>
      </header>
      <div className="overflow-x-auto">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 w-full max-w-full border-t border-blue-500">
          {DAY_LABELS.map((label, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center aspect-square text-[10px] sm:text-xs md:text-sm font-semibold text-blue-900 bg-blue-100 border-r border-b border-blue-200 last:border-r-0"
            >
              <span>{label.en}</span>
              <span className="text-[10px] sm:text-[11px] font-normal text-blue-700 leading-tight">{label.np}</span>
            </div>
          ))}
        </div>

        {/* Dates grid (always 6 rows) */}
        <div className="grid grid-cols-7 grid-rows-6 w-full max-w-full border-l border-blue-200">
          {calendarGrid}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalDateLabel}>
        <div className="space-y-3">
          {selectedEntries.map(entry => (
            <div key={entry.id} className="flex items-start justify-between gap-3 border border-slate-200 rounded-lg p-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 capitalize">{entry.type}</p>
                <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
              </div>
              {entry.link && (
                <Button asLink to={entry.link} variant="outline" size="xs" className="!px-2 !py-1">
                  View
                </Button>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default InteractiveCalendar;
