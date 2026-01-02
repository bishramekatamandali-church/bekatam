
// components/calendar/MonthImageDisplay.tsx
import React from 'react';
import { MonthlyThemeImage } from '../../types';
import Card, { CardContent } from '../ui/Card'; 

interface MonthImageDisplayProps {
  currentBsMonth: number;
  currentBsYear: number;
  monthlyThemeImages: MonthlyThemeImage[];
  loading?: boolean;
}

const MonthImageDisplay: React.FC<MonthImageDisplayProps> = ({
  currentBsMonth,
  currentBsYear,
  monthlyThemeImages,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="p-4 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 animate-pulse">
        Loading images...
      </div>
    );
  }

  const imagesForMonth = monthlyThemeImages.filter(
    (img) => img.year === currentBsYear && img.month === currentBsMonth
  );
  
  const themeForDisplay = imagesForMonth.length > 0 ? imagesForMonth[0] : null;
  
  const displayImageUrls = themeForDisplay?.imageUrls && themeForDisplay.imageUrls.length > 0 
    ? themeForDisplay.imageUrls 
    : [`https://picsum.photos/seed/default_month_${currentBsMonth}_${currentBsYear}_v3/600/150`]; // Fallback if no URLs
  
  const displayCaption = themeForDisplay?.quoteOrCaption || (themeForDisplay && displayImageUrls.length > 1 ? "Swipe/Scroll to see all images" : (themeForDisplay ? "" : "Default theme for this month."));


  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
      <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {displayImageUrls.map((url, index) => (
          <div key={index} className="flex-shrink-0 w-full sm:w-auto"> {/* w-full on small, auto on larger to allow multiple */}
            <img
              src={url}
              alt={displayCaption || `Theme image ${index + 1} for ${currentBsMonth}/${currentBsYear} BS`}
              className="h-40 sm:h-48 object-cover rounded-lg shadow-md flex-shrink-0"
              style={{minWidth: '280px', maxWidth: '100%'}} // Ensure images are reasonably sized and responsive
            />
          </div>
        ))}
      </div>
      {displayCaption && (
        <p className="text-xs italic text-slate-600 dark:text-slate-300 text-center pt-2">
          "{displayCaption}"
        </p>
      )}
       <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .scrollbar-thumb-slate-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db; /* slate-300 */
          border-radius: 3px;
        }
        .dark .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background-color: #4b5563; /* slate-600 */
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default MonthImageDisplay;
