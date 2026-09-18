import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AppThemeMode = 'light' | 'dark';

type AppThemeContextValue = {
  themeMode: AppThemeMode;
  setThemeMode: (mode: AppThemeMode) => void;
};

const APP_THEME_STORAGE_KEY = 'kingshall_app_theme';

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const getInitialTheme = (): AppThemeMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const saved = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  return 'dark';
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<AppThemeMode>(getInitialTheme);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(APP_THEME_STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const value = useMemo(() => ({ themeMode: mode, setThemeMode: setMode }), [mode]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider.');
  }

  return context;
};

export default AppThemeProvider;
