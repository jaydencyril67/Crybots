import React, { createContext, useContext, useEffect, useMemo } from 'react';

export type AppThemeMode = 'dark';
export type AppThemePreference = 'dark';

type AppThemeContextValue = {
  themeMode: AppThemeMode;
  themePreference: AppThemePreference;
  setThemeMode: (mode: AppThemeMode) => void;
  setThemePreference: (preference: AppThemePreference) => void;
};

const APP_THEME_STORAGE_KEY = 'kingshall_app_theme';
const APP_THEME_PREFERENCE_STORAGE_KEY = 'kingshall_app_theme_preference';
const AppThemeContext = createContext<AppThemeContextValue | null>(null);
const keepDark = (_mode: AppThemeMode) => {
  document.documentElement.dataset.theme = 'dark';
};
const keepDarkPreference = (_preference: AppThemePreference) => {
  document.documentElement.dataset.theme = 'dark';
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    try {
      window.localStorage.setItem(APP_THEME_STORAGE_KEY, 'dark');
      window.localStorage.setItem(APP_THEME_PREFERENCE_STORAGE_KEY, 'dark');
    } catch {
      // Theme remains dark when storage is unavailable.
    }
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  const value = useMemo(() => ({
    themeMode: 'dark' as const,
    themePreference: 'dark' as const,
    setThemeMode: keepDark,
    setThemePreference: keepDarkPreference,
  }), []);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error('useAppTheme must be used within an AppThemeProvider.');
  return context;
};

export default AppThemeProvider;
