import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Helper function to determine theme based on current time
const getThemeBasedOnTime = (): Theme => {
  const now = new Date();
  const hour = now.getHours();
  // Light theme: 6am to 6pm (6 to 17)
  // Dark theme: 6pm to 6am (18 to 5)
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get the correct time-based theme
    const timeBasedTheme = getThemeBasedOnTime();
    const storedPeriod = localStorage.getItem('autoThemePeriod');
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    // If we're in the same period (day/night), check for manual override
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
    const isCurrentDay = timeBasedTheme === 'light';
    
    // If stored period matches current period and there's a stored theme
    // and it's different from what it should be, use the stored (manual) theme
    if (storedPeriod === (isCurrentDay ? 'day' : 'night') && storedTheme && storedTheme !== timeBasedTheme) {
      return storedTheme;
    }
    
    // Otherwise use time-based theme
    return timeBasedTheme;
  });

  // Track if there's a manual override for current period
  const [manualOverride, setManualOverride] = useState<string | null>(() => {
    const storedPeriod = localStorage.getItem('autoThemePeriod');
    const timeBasedTheme = getThemeBasedOnTime();
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
    const currentPeriod = isDay ? 'day' : 'night';
    
    // If stored period matches current period and the stored theme is different from time-based,
    // then there's a manual override active
    if (storedPeriod === currentPeriod && storedTheme && storedTheme !== timeBasedTheme) {
      return storedPeriod;
    }
    
    return null;
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check and update theme based on time periodically
  useEffect(() => {
    const updateTheme = () => {
      const timeBasedTheme = getThemeBasedOnTime();
      const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
      const currentPeriod = isDay ? 'day' : 'night';
      const storedPeriod = localStorage.getItem('autoThemePeriod');
      
      // If period changed (crossing 6am or 6pm), clear manual override and auto-switch
      if (storedPeriod !== currentPeriod) {
        localStorage.setItem('autoThemePeriod', currentPeriod);
        setManualOverride(null);
        // Auto-switch to the correct theme for the new period
        setThemeState(timeBasedTheme);
      } else {
        // Same period, only auto-switch if there's no manual override
        if (!manualOverride) {
          setThemeState(timeBasedTheme);
        }
      }
    };

    // Update immediately
    updateTheme();

    // Set up interval to check every minute
    const interval = setInterval(updateTheme, 60000);

    return () => clearInterval(interval);
  }, [manualOverride]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
    const currentPeriod = isDay ? 'day' : 'night';
    
    // Save the manual preference for this period
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('autoThemePeriod', currentPeriod);
    setManualOverride(currentPeriod);
    
    setThemeState(newTheme);
  };

  // Wrapper for setTheme to mark manual override
  const setTheme = (newTheme: Theme | ((prevTheme: Theme) => Theme)) => {
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
    const currentPeriod = isDay ? 'day' : 'night';
    
    const resolvedTheme = typeof newTheme === 'function' ? newTheme(theme) : newTheme;
    
    // Save the manual preference for this period
    localStorage.setItem('theme', resolvedTheme);
    localStorage.setItem('autoThemePeriod', currentPeriod);
    setManualOverride(currentPeriod);
    
    setThemeState(resolvedTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
