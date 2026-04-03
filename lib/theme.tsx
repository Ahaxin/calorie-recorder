import React, { createContext, useContext } from 'react';
import { getColors, LIGHT_COLORS } from './constants';
import { useAuthStore } from '../stores/auth-store';

type Colors = typeof LIGHT_COLORS;

interface ThemeContextValue {
  isDark: boolean;
  colors: Colors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LIGHT_COLORS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const profile = useAuthStore((s) => s.profile);
  const isDark = profile?.theme === 'dark';
  const colors = getColors(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
