
import React, { createContext, useEffect, useContext, ReactNode } from 'react';

// Define placeholder types as the original file is being removed.
// This ensures that any remaining imports do not break compilation immediately.
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme: Theme = 'light';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    if (!root.classList.contains('light')) {
      root.classList.add('light');
    }
    // Remove any previously stored theme to prevent confusion
    localStorage.removeItem('app-theme');
  }, []);

  const setTheme = (newTheme: Theme) => {
    // Theme is locked to 'light', so this function does nothing.
    console.log("Theme is locked to light mode.");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};