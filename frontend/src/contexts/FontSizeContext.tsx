
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { FontSize, FontSizeContextType } from '../types';

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('app-font-size') as FontSize | null) || 'md';
  });

  useEffect(() => {
    const body = window.document.body;
    // Remove any existing font size classes
    body.classList.remove('font-size-xs', 'font-size-sm', 'font-size-md', 'font-size-lg'); // Added 'font-size-xs'
    // Add the current font size class
    body.classList.add(`font-size-${fontSize}`);
    localStorage.setItem('app-font-size', fontSize);
  }, [fontSize]);

  const setFontSize = (newFontSize: FontSize) => {
    setFontSizeState(newFontSize);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = (): FontSizeContextType => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};
