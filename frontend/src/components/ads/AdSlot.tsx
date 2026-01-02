
import React, { useMemo, useEffect, useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import { Advertisement, AdPlacement, AD_SIZES } from '../../types';

interface AdSlotProps {
  placementKey: AdPlacement;
  className?: string;
}

const AdSlot: React.FC<AdSlotProps> = ({ placementKey, className }) => {
  const { advertisements, loadingContent } = useContent();
  
  const [activeAds, setActiveAds] = useState<Advertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (loadingContent) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eligibleAds = advertisements.filter(ad => {
      if (!ad.isActive || !ad.placements.includes(placementKey)) {
        return false;
      }
      const startDate = ad.startDate ? new Date(ad.startDate) : null;
      const endDate = ad.endDate ? new Date(ad.endDate) : null;

      if (startDate && today < startDate) return false;
      if (endDate) {
        const endOfDayEndDate = new Date(endDate);
        endOfDayEndDate.setHours(23, 59, 59, 999);
        if (today > endOfDayEndDate) return false;
      }
      return true;
    }).sort((a, b) => 
      (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity) || 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setActiveAds(eligibleAds);
    setCurrentAdIndex(0);
  }, [advertisements, placementKey, loadingContent]);

  useEffect(() => {
    if (activeAds.length <= 1) return;

    const transitionDuration = 300; 
    const displayDuration = 5000; // 5 seconds per ad

    const intervalId = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentAdIndex(prevIndex => (prevIndex + 1) % activeAds.length);
        setIsTransitioning(false);
      }, transitionDuration);
    }, displayDuration);

    return () => clearInterval(intervalId);
  }, [activeAds]);

  const currentAdToDisplay = useMemo(() => {
    if (activeAds.length === 0) return null;
    return activeAds[currentAdIndex];
  }, [activeAds, currentAdIndex]);
  
  const adDimensions = useMemo(() => {
    const adDefinition = currentAdToDisplay?.adSizeKey ? AD_SIZES[currentAdToDisplay.adSizeKey] : null;
    
    if (adDefinition) {
      const [widthStr, heightStr] = adDefinition.split('x');
      const width = parseInt(widthStr, 10);
      const height = parseInt(heightStr, 10);
      if (!isNaN(width) && !isNaN(height)) {
        return { width, height };
      }
    }
    // Fallback dimensions if AD_SIZES key is invalid or not found
    if (placementKey === 'sidebar_main' || placementKey === 'content_list_interspersed') return { width: 300, height: 250 };
    if (placementKey === 'homepage_banner_top' || placementKey === 'homepage_banner_bottom' || placementKey === 'footer_banner' || placementKey === 'sermon_list_top' || placementKey === 'event_list_top' || placementKey === 'blog_list_top' || placementKey === 'news_list_top') return { width: 728, height: 90 };
    return { width: 300, height: 250 }; // Generic fallback
  }, [currentAdToDisplay, placementKey]);


  if (loadingContent && activeAds.length === 0) {
    const placeholderHeight = placementKey.includes('sidebar') ? 'h-[250px]' : 'h-[90px]';
    return (
      <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className || ''} ${placeholderHeight} w-full flex items-center justify-center text-slate-400 my-4`}>
        Loading Ad...
      </div>
    );
  }

  if (!currentAdToDisplay) {
    return null;
  }

  const adLabelText = 'Ad';

  const adContentElement = (
    <>
      {currentAdToDisplay.adType === 'video_banner' && currentAdToDisplay.videoUrl ? (
        <video
          key={currentAdToDisplay.id + '-video'}
          src={currentAdToDisplay.videoUrl}
          controls={false}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
        />
      ) : currentAdToDisplay.imageUrl ? (
        <img 
          key={currentAdToDisplay.id + '-image'}
          src={currentAdToDisplay.imageUrl} 
          alt={currentAdToDisplay.altText || currentAdToDisplay.name} 
          className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 rounded-md">
            Ad: {currentAdToDisplay.name}
        </div>
      )}
    </>
  );

  const aspectRatio = adDimensions.width / adDimensions.height;

  return (
    <div 
      className={`bem-ad-slot ${placementKey} ${className || ''} my-4 relative flex justify-center w-full`}
      style={{ maxWidth: `${adDimensions.width}px`}} // Slot takes full available width up to its max
      role="complementary" 
      aria-label={`${adLabelText}: ${currentAdToDisplay.name}`}
    >
      <span className="absolute top-0 right-0 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded-bl-md rounded-tr-md z-20">
        {adLabelText}
      </span>
      <div 
        key={currentAdToDisplay.id} // This key change will trigger re-render for fade
        className={`relative w-full shadow-sm overflow-hidden rounded-md transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          aspectRatio: `${aspectRatio}`, // Maintain aspect ratio
          maxHeight: `${adDimensions.height}px` // Cap height
        }} 
      >
        {currentAdToDisplay.linkUrl ? (
          <a 
            href={currentAdToDisplay.linkUrl} 
            target="_blank" 
            rel="noopener noreferrer sponsored"
            aria-label={currentAdToDisplay.altText || `${adLabelText}: ${currentAdToDisplay.name}`}
            className="block w-full h-full" // Link covers the entire area
          >
            {adContentElement}
          </a>
        ) : (
          <div className="block w-full h-full">
              {adContentElement}
          </div>
        )}
      </div>
      <style>{`
        .bem-ad-slot .transition-opacity { transition-property: opacity; }
        .bem-ad-slot .duration-300 { transition-duration: 300ms; }
        .bem-ad-slot .ease-in-out { transition-timing-function: ease-in-out; }
        .bem-ad-slot .opacity-0 { opacity: 0; }
        .bem-ad-slot .opacity-100 { opacity: 1; }
      `}</style>
    </div>
  );
};

export default AdSlot;
