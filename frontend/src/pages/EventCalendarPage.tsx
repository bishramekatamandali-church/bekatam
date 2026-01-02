import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useContent } from '../contexts/ContentContext';
import InteractiveCalendar from '../components/calendar/InteractiveCalendar';
import MonthImageDisplay from '../components/calendar/MonthImageDisplay';
import { generateYearlyCalendarPDF } from '../components/calendar/PrintableCalendarPDF';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import { adToBsSimulated, formatDateADBS } from '../dateConverter'; 
import { EventItem, MonthlyThemeImage } from '../types';
import { Link } from "react-router-dom";


const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 006 19.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" />
  </svg>
);


type PaperSizeType = 'a4' | 'a3' | 'a2' | 'a1';

const BS_MONTH_NAMES_EN_CAL = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Ashwin", "Kartik", "Mangsir", "Poush", "Magh",
  "Falgun", "Chaitra"
];


const EventCalendarPage: React.FC = () => {
  const { events, monthlyThemeImages, loadingContent } = useContent();
  
  const currentADDate = new Date();
  const initialBsDate = useMemo(() => adToBsSimulated(currentADDate), [currentADDate]); 

  const [selectedPdfBsYear, setSelectedPdfBsYear] = useState<number>(initialBsDate.year);
  const [selectedPaperSize, setSelectedPaperSize] = useState<PaperSizeType>('a4');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string>('');

  const [currentCalendarBsMonth, setCurrentCalendarBsMonth] = useState<number>(initialBsDate.month);
  const [currentCalendarBsYear, setCurrentCalendarBsYear] = useState<number>(initialBsDate.year);

  const handleCalendarMonthChange = useCallback((bsMonth: number, bsYear: number) => {
    setCurrentCalendarBsMonth(bsMonth);
    setCurrentCalendarBsYear(bsYear);
  }, []);
  
  const eventsForSelectedMonth = useMemo(() => {
    return events.filter(event => {
        if (!event.date) return false;
        const eventAdDate = new Date(event.date);
        const eventBsDate = adToBsSimulated(eventAdDate);
        return eventBsDate.year === currentCalendarBsYear && eventBsDate.month === currentCalendarBsMonth;
    }).sort((a,b) => new Date(a.date!).getDate() - new Date(b.date!).getDate());
  }, [events, currentCalendarBsMonth, currentCalendarBsYear]);


  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPdfBsYear(parseInt(event.target.value, 10));
  };

  const handlePaperSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaperSize(event.target.value as PaperSizeType);
  };

  const handleDownloadPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    setPdfStatusMessage("Generating PDF, please wait...");
    try {
      const churchName = "BEM Church"; 
      const churchWebsite = window.location.origin;
      await generateYearlyCalendarPDF(selectedPdfBsYear, events, churchName, churchWebsite, monthlyThemeImages, selectedPaperSize);
      setPdfStatusMessage("PDF Generated!");
      setTimeout(() => setPdfStatusMessage(''), 3000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfStatusMessage("Error generating PDF.");
      setTimeout(() => setPdfStatusMessage(''), 5000);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [selectedPdfBsYear, events, monthlyThemeImages, selectedPaperSize]);

  const availableBsYears = useMemo(() => Array.from({ length: 10 }, (_, i) => initialBsDate.year - 5 + i), [initialBsDate.year]);
  
  const currentDisplayedBsMonthName = BS_MONTH_NAMES_EN_CAL[currentCalendarBsMonth - 1];


  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-2 sm:px-4 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">Church Event Calendar</h1>
          <p className="text-md sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Stay updated with all our church events and activities, in both AD and BS calendars.
          </p>
        </header>
        
        <div className="max-w-4xl mx-auto">
            <MonthImageDisplay
                currentBsMonth={currentCalendarBsMonth}
                currentBsYear={currentCalendarBsYear}
                monthlyThemeImages={monthlyThemeImages}
                loading={loadingContent}
            />

            <Card className="mt-6 shadow-xl">
                {loadingContent && !events.length ? (
                    <div className="p-4 sm:p-6 h-full flex items-center justify-center min-h-[400px]">
                        <p className="text-center text-slate-500 py-10">Loading calendar...</p>
                    </div>
                ) : (
                    <>
                    <InteractiveCalendar
                      events={events}
                      onMonthChange={handleCalendarMonthChange}
                      initialBsMonth={currentCalendarBsMonth}
                      initialBsYear={currentCalendarBsYear}
                    />
                    <div className="mt-4 border-t border-blue-200">
                        <CardHeader className="bg-blue-100">
                            <h2 className="text-xl font-semibold text-blue-800">
                                Events in {currentDisplayedBsMonthName} {currentCalendarBsYear} BS
                            </h2>
                        </CardHeader>
                        <CardContent className="max-h-96 overflow-y-auto custom-scrollbar p-3 sm:p-4">
                            {loadingContent && !eventsForSelectedMonth.length ? (
                                <p className="text-slate-500 text-center py-6">Loading events...</p>
                            ) : eventsForSelectedMonth.length === 0 ? (
                                <p className="text-slate-500 text-center py-6">No events scheduled for this month.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {eventsForSelectedMonth.map(event => {
                                        const eventBsDate = adToBsSimulated(new Date(event.date!));
                                        const adDatePart = formatDateADBS(event.date!).split(' (')[1]?.replace(')', '');
                                        return (
                                            <li key={event.id} className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                                <Link to={`/events/${event.id}`} className="block">
                                                    <h4 className="font-semibold text-blue-700">{event.title}</h4>
                                                    <div className="flex items-center text-sm text-slate-500 mt-1">
                                                        <CalendarDaysIcon className="w-4 h-4 mr-2 text-slate-400" />
                                                        <span>{eventBsDate.day} {currentDisplayedBsMonthName} ({adDatePart})</span>
                                                        {event.time && <span className="ml-2">@ {event.time}</span>}
                                                    </div>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </CardContent>
                    </div>
                    </>
                )}
            </Card>
        </div>

        <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-teal-300 bg-white shadow-lg">
                <CardHeader className="bg-teal-100">
                    <h2 className="text-xl font-semibold text-teal-700">Download PDF Calendar</h2>
                    <p className="text-sm text-teal-600">Select year and paper size for your printable calendar.</p>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="pdf-year-select" className="text-sm font-medium text-slate-700">
                            Select Year: (BS)
                        </label>
                        <select
                            id="pdf-year-select"
                            value={selectedPdfBsYear}
                            onChange={handleYearChange}
                            className="p-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-teal-500 focus:border-teal-500"
                            disabled={isGeneratingPdf}
                        >
                            {availableBsYears.map(year => (
                            <option key={year} value={year}>{year} BS</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="paper-size-select" className="text-sm font-medium text-slate-700">Paper Size:</label>
                        <select
                            id="paper-size-select"
                            value={selectedPaperSize}
                            onChange={handlePaperSizeChange}
                            className="p-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-teal-500 focus:border-teal-500"
                            disabled={isGeneratingPdf}
                        >
                            <option value="a4">A4</option>
                            <option value="a3">A3</option>
                            <option value="a2">A2</option>
                            <option value="a1">A1</option>
                        </select>
                    </div>
                    <Button
                    onClick={handleDownloadPdf}
                    variant="primary"
                    disabled={isGeneratingPdf || loadingContent}
                    className="w-full sm:w-auto"
                    >
                    <DownloadIcon className="mr-2 h-5 w-5" />
                    {isGeneratingPdf ? "Generating PDF..." : `Download PDF Calendar for ${selectedPdfBsYear} BS`}
                    </Button>
                </CardContent>
                {pdfStatusMessage && (
                    <CardFooter className={`p-3 text-sm ${pdfStatusMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {pdfStatusMessage}
                    </CardFooter>
                )}
            </Card>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
};

export default EventCalendarPage;