
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { adToBsSimulated, bsToAdSimulated, getDaysInBsMonthSimulated, AD_BS_YEAR_DIFF } from '../../dateConverter';
import Button from '../ui/Button';

interface BSCalendarPickerProps {
  initialAdDate?: string; // YYYY-MM-DD
  onDateSelect: (bsDay: number, bsMonth: number, bsYear: number) => void;
}

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
);

const BS_MONTH_NAMES_EN = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Ashwin", "Kartik", "Mangsir", "Poush", "Magh",
  "Falgun", "Chaitra"
];

const BSCalendarPicker: React.FC<BSCalendarPickerProps> = ({ initialAdDate, onDateSelect }) => {
  const defaultInitialBsDate = adToBsSimulated(new Date());

  const [currentBsMonth, setCurrentBsMonth] = useState<number>(defaultInitialBsDate.month);
  const [currentBsYear, setCurrentBsYear] = useState<number>(defaultInitialBsDate.year);
  const [selectedBsDate, setSelectedBsDate] = useState<{ day: number; month: number; year: number } | null>(null);

  useEffect(() => {
    if (initialAdDate) {
      try {
        const adDate = new Date(initialAdDate);
        if (!isNaN(adDate.getTime())) {
          const bsDate = adToBsSimulated(adDate);
          setCurrentBsMonth(bsDate.month);
          setCurrentBsYear(bsDate.year);
          setSelectedBsDate({ day: bsDate.day, month: bsDate.month, year: bsDate.year });
        } else {
          // If initialAdDate is invalid, reset to current date based selection state
          const todayBs = adToBsSimulated(new Date());
          setCurrentBsMonth(todayBs.month);
          setCurrentBsYear(todayBs.year);
          setSelectedBsDate(null); // No day selected if initialAdDate was invalid
        }
      } catch (e) {
        console.error("Error parsing initialAdDate for BSCalendarPicker:", e);
        const todayBs = adToBsSimulated(new Date());
        setCurrentBsMonth(todayBs.month);
        setCurrentBsYear(todayBs.year);
        setSelectedBsDate(null);
      }
    } else {
        const todayBs = adToBsSimulated(new Date());
        setCurrentBsMonth(todayBs.month);
        setCurrentBsYear(todayBs.year);
        setSelectedBsDate(null); // No specific day selected if no initial date provided
    }
  }, [initialAdDate]);

  const handlePrevMonth = () => {
    let newMonth = currentBsMonth - 1;
    let newYear = currentBsYear;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setCurrentBsMonth(newMonth);
    setCurrentBsYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonth = currentBsMonth + 1;
    let newYear = currentBsYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setCurrentBsMonth(newMonth);
    setCurrentBsYear(newYear);
  };

  const handleDayClick = (day: number) => {
    setSelectedBsDate({ day, month: currentBsMonth, year: currentBsYear });
    onDateSelect(day, currentBsMonth, currentBsYear);
  };
  
  const yearOptions = useMemo(() => {
    const years = [];
    const currentAdYear = new Date().getFullYear();
    const currentBsEquivalentYear = currentAdYear + AD_BS_YEAR_DIFF;
    for (let i = -5; i <= 5; i++) { 
      years.push(currentBsEquivalentYear + i);
    }
    return years;
  }, []);

  const calendarGrid = useMemo(() => {
    const numDaysInMonth = getDaysInBsMonthSimulated(currentBsMonth, currentBsYear);
    const firstAdDateOfMonth = bsToAdSimulated(1, currentBsMonth, currentBsYear);
    const firstDayOfWeek = firstAdDateOfMonth.getDay(); 

    const daysArray = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(<div key={`empty-start-${i}`} className="border p-1 h-10 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50"></div>);
    }

    for (let day = 1; day <= numDaysInMonth; day++) {
      const isSelected = selectedBsDate && selectedBsDate.day === day && selectedBsDate.month === currentBsMonth && selectedBsDate.year === currentBsYear;
      const adDateForBsDay = bsToAdSimulated(day, currentBsMonth, currentBsYear);
      const isSaturday = adDateForBsDay.getDay() === 6;
      const todayAd = new Date();
      const isToday = adDateForBsDay.toDateString() === todayAd.toDateString();

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
          <span className={`block ${isSelected ? '' : (isSaturday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200')}`}>{day}</span>
          <span className={`block text-[9px] ${isSelected ? 'text-purple-100 dark:text-purple-200' : (isSaturday ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500')}`}>{adDateForBsDay.getDate()}</span>
        </button>
      );
    }

    const remainingCells = 7 - (daysArray.length % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        daysArray.push(<div key={`empty-end-${i}`} className="border p-1 h-10 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50"></div>);
      }
    }
    return daysArray;
  }, [currentBsMonth, currentBsYear, selectedBsDate]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/30">
      <div className="flex justify-between items-center mb-2 px-1">
        <Button type="button" onClick={handlePrevMonth} variant="ghost" size="sm" className="!p-1.5 dark:text-slate-300 dark:hover:bg-slate-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <select
            value={currentBsMonth}
            onChange={(e) => setCurrentBsMonth(parseInt(e.target.value))}
            className="p-1.5 border border-slate-300 dark:border-slate-500 rounded-md text-xs bg-white dark:bg-slate-600 dark:text-slate-200 focus:ring-1 focus:ring-purple-500"
            aria-label="Select BS Month"
          >
            {BS_MONTH_NAMES_EN.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={currentBsYear}
            onChange={(e) => setCurrentBsYear(parseInt(e.target.value))}
            className="p-1.5 border border-slate-300 dark:border-slate-500 rounded-md text-xs bg-white dark:bg-slate-600 dark:text-slate-200 focus:ring-1 focus:ring-purple-500"
            aria-label="Select BS Year"
          >
            {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <Button type="button" onClick={handleNextMonth} variant="ghost" size="sm" className="!p-1.5 dark:text-slate-300 dark:hover:bg-slate-700">
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium bg-slate-200 dark:bg-slate-600 border border-slate-200 dark:border-slate-600">
        {dayLabels.map((label, index) => (
          <div key={index} className="py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{label}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-600 border-x border-b border-slate-200 dark:border-slate-600">
        {calendarGrid}
      </div>
    </div>
  );
};

export default BSCalendarPicker;