
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { EventItem, BSSimulatedDate } from '../../types';
import { adToBsSimulated, bsToAdSimulated, getDaysInBsMonthSimulated, AD_BS_YEAR_DIFF } from '../../dateConverter';
import Button from '../ui/Button';

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
);

const BS_MONTH_NAMES_EN = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Ashwin", "Kartik", "Mangsir", "Poush", "Magh",
  "Falgun", "Chaitra"
];

const AD_MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


interface InteractiveCalendarProps {
  events: EventItem[];
  onMonthChange?: (bsMonth: number, bsYear: number) => void;
  initialBsMonth?: number;
  initialBsYear?: number;
}

const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({ events, onMonthChange, initialBsMonth, initialBsYear }) => {
  const defaultInitialAdDate = useMemo(() => new Date(), []);
  const defaultInitialBsDate = useMemo(() => adToBsSimulated(defaultInitialAdDate), [defaultInitialAdDate]);

  const [currentBsMonth, setCurrentBsMonth] = useState<number>(initialBsMonth || defaultInitialBsDate.month);
  const [currentBsYear, setCurrentBsYear] = useState<number>(initialBsYear || defaultInitialBsDate.year);
  
  const [selectedBsDate, setSelectedBsDate] = useState<BSSimulatedDate | null>(null);

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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentBsYear(parseInt(e.target.value, 10));
  };

  const goToToday = () => {
    const todayAd = new Date();
    const todayBs = adToBsSimulated(todayAd);
    setCurrentBsMonth(todayBs.month);
    setCurrentBsYear(todayBs.year);
    setSelectedBsDate(todayBs); 
  };
  
  const yearOptions = useMemo(() => {
    const years = [];
    const referenceYear = defaultInitialBsDate.year;
    for (let i = -10; i <= 10; i++) { years.push(referenceYear + i); }
    return years;
  }, [defaultInitialBsDate.year]);

  const adHeaderDisplay = useMemo(() => {
    const firstAdDateOfBsMonth = bsToAdSimulated(1, currentBsMonth, currentBsYear);
    const numDaysInCurrentBsMonth = getDaysInBsMonthSimulated(currentBsMonth, currentBsYear);
    const lastAdDateOfBsMonth = bsToAdSimulated(numDaysInCurrentBsMonth, currentBsMonth, currentBsYear);

    const startAdMonthName = AD_MONTH_NAMES_EN[firstAdDateOfBsMonth.getMonth()];
    const endAdMonthName = AD_MONTH_NAMES_EN[lastAdDateOfBsMonth.getMonth()];

    const startAdYear = firstAdDateOfBsMonth.getFullYear();
    const endAdYear = lastAdDateOfBsMonth.getFullYear();

    if (startAdYear === endAdYear) {
      return startAdMonthName === endAdMonthName ? `${startAdMonthName} ${startAdYear} AD` : `${startAdMonthName} / ${endAdMonthName} ${startAdYear} AD`;
    }
    return `${startAdMonthName} ${startAdYear} / ${endAdMonthName} ${endAdYear} AD`;
  }, [currentBsMonth, currentBsYear]);

  const calendarGrid = useMemo(() => {
    const numDaysInMonth = getDaysInBsMonthSimulated(currentBsMonth, currentBsYear);
    const firstAdDateOfMonth = bsToAdSimulated(1, currentBsMonth, currentBsYear);
    const firstDayOfWeek = firstAdDateOfMonth.getDay();

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
      const adDateForBsDay = bsToAdSimulated(day, currentBsMonth, currentBsYear);
      const isToday = adDateForBsDay.toDateString() === defaultInitialAdDate.toDateString();
      const isSelectedDay = selectedBsDate?.day === day && selectedBsDate?.month === currentBsMonth && selectedBsDate?.year === currentBsYear;

      const eventsOnDay = events.filter(event => {
        if (!event.date) return false;
        const eventAdDate = new Date(event.date);
        return eventAdDate.getFullYear() === adDateForBsDay.getFullYear() &&
               eventAdDate.getMonth() === adDateForBsDay.getMonth() &&
               eventAdDate.getDate() === adDateForBsDay.getDate();
      });

      const isSaturday = adDateForBsDay.getDay() === 6;

      days.push(
        <div
          key={day}
          className={`relative border-r border-b border-blue-200 p-1.5 cursor-pointer hover:bg-blue-50 transition-colors duration-150 flex flex-col justify-between aspect-square
            ${isSaturday ? 'bg-green-50' : 'bg-white'} 
            ${isSelectedDay ? 'bg-purple-200 ring-2 ring-purple-500' : isToday ? 'ring-2 ring-amber-500' : ''}`}
          onClick={() => setSelectedBsDate({ day, month: currentBsMonth, year: currentBsYear, monthName: BS_MONTH_NAMES_EN[currentBsMonth-1] })}
          role="button" tabIndex={0}
          aria-label={`View events for BS ${day}, ${BS_MONTH_NAMES_EN[currentBsMonth-1]} ${currentBsYear}`}
        >
          {/* AD small number */}
          <span className={`absolute top-1 right-1 text-[9px] sm:text-[10px] md:text-xs ${isSelectedDay ? 'text-purple-600' : (isSaturday ? 'text-green-500' : 'text-slate-400')}`}>
            {adDateForBsDay.getDate()}
          </span>
          
          {/* BS big number */}
          <div className="flex-grow flex items-center justify-center">
            <span className={`font-bold text-base sm:text-lg md:text-xl lg:text-2xl ${isSelectedDay ? 'text-purple-800' : (isSaturday ? 'text-green-700' : 'text-slate-700')}`}>
              {day}
            </span>
          </div>

          {/* Events */}
          {eventsOnDay.length > 0 && (
            <div className="flex justify-center items-end space-x-1 h-4">
              {eventsOnDay.slice(0, 4).map(event => ( 
                <div key={event.id} className="relative group">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-max max-w-[200px] px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" role="tooltip">
                    {event.title}
                  </div>
                </div>
              ))}
              {eventsOnDay.length > 4 && <div className="text-xs text-teal-600">+</div>}
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
  }, [currentBsMonth, currentBsYear, events, defaultInitialAdDate, selectedBsDate]);
  
  const currentMonthName = BS_MONTH_NAMES_EN[currentBsMonth - 1];

  return (
    <div className="bg-white rounded-t-lg">
      <header className="bg-blue-600 text-white p-4 flex flex-row justify-between items-center rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Button onClick={handlePrevMonth} variant="ghost" size="sm" className="!p-2 !text-white hover:!bg-blue-500" aria-label="Previous Month">
            <ChevronLeftIcon className="w-6 h-6" />
          </Button>
          <Button onClick={goToToday} variant="ghost" size="sm" className="!p-2 !text-white hover:!bg-blue-500 text-sm">
            Today
          </Button>
          <Button onClick={handleNextMonth} variant="ghost" size="sm" className="!p-2 !text-white hover:!bg-blue-500" aria-label="Next Month">
            <ChevronRightIcon className="w-6 h-6" />
          </Button>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-left">
              {currentMonthName} {currentBsYear} BS
            </h2>
            <select 
              value={currentBsYear} 
              onChange={handleYearChange} 
              className="bg-blue-500 border-blue-400 text-white text-sm rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
              aria-label="Select Year"
            >
              {yearOptions.map(year => <option key={year} value={year}>{year} BS</option>)}
            </select>
          </div>
          <p className="text-sm text-blue-100 mt-1 text-right">{adHeaderDisplay}</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 w-full max-w-full border-t border-blue-500">
          {DAY_LABELS_EN.map((label, index) => (
            <div
              key={index}
              className="flex items-center justify-center aspect-square 
                         text-[10px] sm:text-xs md:text-sm font-medium 
                         text-blue-800 bg-blue-100 border-r border-b border-blue-200 last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Dates grid (always 6 rows) */}
        <div className="grid grid-cols-7 grid-rows-6 w-full max-w-full border-l border-blue-200">
          {calendarGrid}
        </div>
      </div>
    </div>
  );
};

export default InteractiveCalendar;
