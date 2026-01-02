


import React from 'react';
import Button from '../ui/Button';

// This component is effectively replaced by HeroSlider.tsx
// It can be removed if no longer directly used or referenced elsewhere.
// Keeping it for now to show it was part of the previous state.

const HeroSection: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white py-16 md:py-24">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20" 
        style={{ backgroundImage: "url('https://picsum.photos/seed/churchhero/1600/900')" }}
      ></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Welcome to <span className="text-teal-400">Bishram Ekata Mandali</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
          A place of faith, community, and love. Discover your purpose and grow with us.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button asLink to="/events" variant="primary" size="lg">
            Upcoming Events
          </Button>
          <Button asLink to="/contact" variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-slate-800">
            New Here?
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;