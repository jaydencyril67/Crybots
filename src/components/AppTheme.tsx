import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppThemeMode = 'light' | 'dark';
export type AppThemePreference = 'light' | 'dark' | 'system' | 'shift';

type AppThemeContextValue = {
  themeMode: AppThemeMode;
  themePreference: AppThemePreference;
  setThemeMode: (mode: AppThemeMode) => void;
  setThemePreference: (preference: AppThemePreference) => void;
};

const APP_THEME_STORAGE_KEY = 'kingshall_app_theme';
const APP_THEME_PREFERENCE_STORAGE_KEY = 'kingshall_app_theme_preference';

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const getInitialPreference = (): AppThemePreference => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedPreference = window.localStorage.getItem(APP_THEME_PREFERENCE_STORAGE_KEY);
  if (savedPreference === 'light' || savedPreference === 'dark' || savedPreference === 'system' || savedPreference === 'shift') {
    return savedPreference;
  }

  const legacyTheme = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
  return legacyTheme === 'light' || legacyTheme === 'dark' ? legacyTheme : 'dark';
};

const getSystemTheme = (): AppThemeMode => (
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
);

const getShiftTheme = (): AppThemeMode => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themePreference, setThemePreference] = useState<AppThemePreference>(getInitialPreference);
  const [mode, setMode] = useState<AppThemeMode>(() => {
    const preference = getInitialPreference();
    return preference === 'system' ? getSystemTheme() : preference === 'shift' ? getShiftTheme() : preference;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const applyAutomaticTheme = () => {
      if (themePreference === 'system') {
        setMode(getSystemTheme());
      } else if (themePreference === 'shift') {
        setMode(getShiftTheme());
      }
    };

    window.localStorage.setItem(APP_THEME_PREFERENCE_STORAGE_KEY, themePreference);
    window.localStorage.setItem(APP_THEME_STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;

    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      mediaQuery.addEventListener('change', applyAutomaticTheme);
      return () => mediaQuery.removeEventListener('change', applyAutomaticTheme);
    }

    if (themePreference === 'shift') {
      const timer = window.setInterval(applyAutomaticTheme, 60 * 1000);
      return () => window.clearInterval(timer);
    }

    return undefined;
  }, [mode, themePreference]);

  const handlePreferenceChange = (preference: AppThemePreference) => {
    setThemePreference(preference);
    if (preference === 'system') {
      setMode(getSystemTheme());
    } else if (preference === 'shift') {
      setMode(getShiftTheme());
    } else {
      setMode(preference);
    }
  };

  const value = useMemo(() => ({
    themeMode: mode,
    themePreference,
    setThemeMode: setMode,
    setThemePreference: handlePreferenceChange,
  }), [mode, themePreference]);

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
