
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
  
  const [currentBsDate, setCurrentBsDate] = useState<{ month: number; year: number }>(() => ({
    month: initialBsMonth ?? defaultInitialBsDate.month,
    year: initialBsYear ?? defaultInitialBsDate.year,
  }));
  
  const [selectedBsDate, setSelectedBsDate] = useState<BSDate | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<CalendarEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDateLabel, setModalDateLabel] = useState('');

  useEffect(() => {
    if (initialBsMonth === undefined && initialBsYear === undefined) {
      return;
    }
    setCurrentBsDate(prev => {
      const nextMonth = initialBsMonth ?? prev.month;
      const nextYear = initialBsYear ?? prev.year;
      if (nextMonth === prev.month && nextYear === prev.year) {
        return prev;
      }
      return { month: nextMonth, year: nextYear };
    });
  }, [initialBsMonth, initialBsYear]);

  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentBsDate.month, currentBsDate.year);
    }
  }, [currentBsDate.month, currentBsDate.year, onMonthChange]);
  
  useEffect(() => {
    setSelectedBsDate(null);
    setSelectedEntries([]);
    setIsModalOpen(false);
  }, [currentBsDate.month, currentBsDate.year]);

  const handlePrevMonth = () => {
    setCurrentBsDate(prev => {
      if (prev.month === 1 && prev.year === BS_YEAR_RANGE.start) {
        return prev;
      }

      let newMonth = prev.month - 1;
      let newYear = prev.year;

      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      if (newYear < BS_YEAR_RANGE.start) {
        return prev;
      }

      return { month: newMonth, year: newYear };
    });
  };

  const handleNextMonth = () => {
    setCurrentBsDate(prev => {
      if (prev.month === 12 && prev.year === BS_YEAR_RANGE.end) {
        return prev;
      }

      let newMonth = prev.month + 1;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
      if (newYear > BS_YEAR_RANGE.end) {
        return prev;
      }

      return { month: newMonth, year: newYear };
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextYear = parseInt(e.target.value, 10);
    setCurrentBsDate(prev => ({ ...prev, year: nextYear }));
  };

  const goToToday = () => {
    const todayAd = getLocalToday();
    const todayBs = adToBs(todayAd);
    setCurrentBsDate({ month: todayBs.month, year: todayBs.year });
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

  
  const currentBsMonthAdRangeLabel = useMemo(() => {
    const endAdDay = getDaysInBsMonth(currentBsDate.month, currentBsDate.year);
    const startAdDate = bsToAd(1, currentBsDate.month, currentBsDate.year);
    const endAdDate = bsToAd(endAdDay, currentBsDate.month, currentBsDate.year);
    const startParts = getNepalDateParts(startAdDate);
    const endParts = getNepalDateParts(endAdDate);
    const startMonthLabel = formatADDate(startAdDate, { month: 'short' });
    const endMonthLabel = formatADDate(endAdDate, { month: 'short' });

    if (startParts.year === endParts.year && startParts.month === endParts.month) {
      return `${startMonthLabel} ${startParts.year}`;
    }
    if (startParts.year === endParts.year) {
      return `${startMonthLabel}/${endMonthLabel} ${startParts.year}`;
    }
    return `${startMonthLabel}/${endMonthLabel} ${startParts.year}-${endParts.year}`;
  }, [currentBsDate.month, currentBsDate.year]);

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
    const numDaysInMonth = getDaysInBsMonth(currentBsDate.month, currentBsDate.year);
    const firstAdDateOfMonth = bsToAd(1, currentBsDate.month, currentBsDate.year);
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
      const adDateForBsDay = bsToAd(day, currentBsDate.month, currentBsDate.year);
      const adParts = getNepalDateParts(adDateForBsDay);
      const adMonthLabel = formatADDate(adDateForBsDay, { month: 'short' });
      const adOverlayLabel = adParts.day === 1 ? `${adMonthLabel} ${adParts.day}` : `${adParts.day}`;
      const isToday = isSameNepalDay(adDateForBsDay, defaultInitialAdDate);
      const isSelectedDay = selectedBsDate?.day === day && selectedBsDate?.month === currentBsDate.month && selectedBsDate?.year === currentBsDate.year;
      
      const entriesOnDay = itemsByDate.get(getAdDateKey(adDateForBsDay)) ?? [];

      const isSaturday = getNepalDayOfWeek(adDateForBsDay) === 6;

      days.push(
        <div
          key={day}
          className={`relative border-r border-b border-blue-200 p-1.5 cursor-pointer hover:bg-blue-50 transition-colors duration-150 flex flex-col justify-between aspect-square
            ${isSaturday ? 'bg-green-50' : 'bg-white'} 
            ${isSelectedDay ? 'bg-purple-200 ring-2 ring-purple-500' : isToday ? 'ring-2 ring-amber-500' : ''}`}
          onClick={() => {
            const bsDate = { day, month: currentBsDate.month, year: currentBsDate.year, monthName: BS_MONTH_NAMES_NP[currentBsDate.month - 1] };
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
          aria-label={`View events for BS ${day}, ${BS_MONTH_NAMES_NP[currentBsDate.month - 1]} ${currentBsDate.year}`}
        >
          {/* AD small number */}
          <span className={`absolute top-1 right-1 text-[9px] sm:text-[10px] md:text-xs ${isSelectedDay ? 'text-purple-600' : (isSaturday ? 'text-green-500' : 'text-slate-400')}`}>
            {adOverlayLabel}
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
  }, [currentBsDate.month, currentBsDate.year, itemsByDate, defaultInitialAdDate, selectedBsDate]);
  
  const currentMonthNameShort = BS_MONTH_NAMES_SHORT[currentBsDate.month - 1] || BS_MONTH_NAMES_NP[currentBsDate.month - 1];

  return (
    <div className="bg-white rounded-t-lg">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-4 rounded-t-lg">
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[auto,1fr,auto] lg:items-center">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <Button onClick={handlePrevMonth} variant="ghost" size="sm" className="!p-2 !text-white hover:!bg-blue-500" aria-label="Previous Month">
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
            <Button onClick={goToToday} variant="ghost" size="sm" className="!px-3 !py-1 text-xs font-semibold !text-white hover:!bg-blue-500 border border-white/50 rounded-full" aria-label="Jump to today">
              Today
            </Button>
            <Button onClick={handleNextMonth} variant="ghost" size="sm" className="!p-2 !text-white hover:!bg-blue-500" aria-label="Next Month">
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-wide text-blue-100">Calendar</p>
            <h2 className="text-lg sm:text-xl font-semibold tracking-wide">
              {currentMonthNameShort} {currentBsDate.year} BS
            </h2>
            <p className="text-xs text-blue-100">AD Range: {currentBsMonthAdRangeLabel}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-blue-500/35 px-3 py-2 rounded-lg lg:justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="calendar-year" className="text-[11px] uppercase tracking-wide text-blue-100">Year</label>
              <select
                id="calendar-year"
                value={currentBsDate.year}
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
            <div className="flex items-center gap-2">
              <label htmlFor="calendar-month" className="text-[11px] uppercase tracking-wide text-blue-100">Month</label>
              <select
                id="calendar-month"
                value={currentBsDate.month}
                onChange={(event) => setCurrentBsDate(prev => ({ ...prev, month: parseInt(event.target.value, 10) }))}
                className="bg-blue-500 border border-blue-400 text-white text-xs rounded-md px-2 py-1 focus:ring-amber-500 focus:border-amber-500 min-w-[130px] text-center"
                aria-label="Select Month"
              >
                {BS_MONTH_NAMES_NP.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div> 
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
