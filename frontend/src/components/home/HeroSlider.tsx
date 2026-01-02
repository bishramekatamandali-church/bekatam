

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from "react-router-dom";
import { HomeSlide } from '../../types'; // Using HomeSlide type for slide structure
import Button from '../ui/Button';

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

interface HeroSliderProps {
  slides: HomeSlide[];
  loading?: boolean;
  autoScrollInterval?: number; // in milliseconds
}

const HeroSlider: React.FC<HeroSliderProps> = ({ slides, loading = false, autoScrollInterval = 2000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter active slides and sort by order once, when slides or loading state changes
  const activeSlides = React.useMemo(() => {
    if (loading) return []; // Return empty if loading to prevent processing incomplete data
    return slides
      .filter(slide => slide.isActive)
      .sort((a, b) => a.order - b.order);
  }, [slides, loading]);


  const nextSlide = useCallback(() => {
    if (activeSlides.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeSlides.length);
    }
  }, [activeSlides.length]);

  const prevSlide = () => {
    if (activeSlides.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + activeSlides.length) % activeSlides.length);
    }
  };

  useEffect(() => {
    if (activeSlides.length <= 1) return; 
    const intervalId = setInterval(nextSlide, autoScrollInterval);
    return () => clearInterval(intervalId);
  }, [nextSlide, activeSlides.length, autoScrollInterval]);

  if (loading) {
    return (
      <div className="relative bg-slate-700 text-white py-24 animate-pulse h-[45vh] md:h-[56vh] flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-10 bg-slate-600 rounded w-3/4 mx-auto mb-6"></div>
          <div className="h-6 bg-slate-600 rounded w-1/2 mx-auto mb-10"></div>
          <div className="h-12 bg-slate-600 rounded w-40 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (activeSlides.length === 0) {
    return (
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white py-24 h-[45vh] md:h-[56vh] flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Welcome to <span className="text-purple-400">Our Community</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 max-w-3xl mx-auto mb-10">
            Explore and learn more about us. Content is being prepared.
          </p>
           <Button asLink to="/contact" variant="primary" size="lg">
            Contact Us
          </Button>
        </div>
      </div>
    );
  }

  const currentSlide = activeSlides[currentIndex];
  if (!currentSlide) { // Should not happen if activeSlides.length > 0, but good safety check
      return (
          <div className="relative bg-red-200 text-red-800 py-24 h-[45vh] md:h-[56vh] flex items-center justify-center">
              <p>Error: Could not load current slide.</p>
          </div>
      );
  }


  return (
    <div className="relative w-full h-[45vh] md:h-[56vh] overflow-hidden">
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id || `slide-${index}`} // Fallback key if id is somehow missing
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: `url(${slide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden={index !== currentIndex}
          role="tabpanel"
        >
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 animate-fadeInUp">
                {slide.title}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto mb-10 animate-fadeInUp animation-delay-300">
                {slide.description}
              </p>
              <Button asLink to={slide.linkPath} variant="primary" size="lg" className="animate-fadeInUp animation-delay-600">
                {slide.ctaText}
              </Button>
            </div>
          </div>
        </div>
      ))}

      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {activeSlides.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-purple-500' : 'bg-white bg-opacity-50 hover:bg-opacity-75'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
};

export default HeroSlider;