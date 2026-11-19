import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CampusTheme {
  id: string;
  name: string;
  description: string;
  background: string;
  surface: string;
  card: string;
  accent: string;
  primaryText: string;
  secondaryText: string;
  border: string;
  accentMuted: string;
  isDark: boolean;
}

export const CAMPUS_THEMES: CampusTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep obsidian base with modern soft-indigo accent',
    background: '#101114',
    surface: '#1B1D22',
    card: '#252832',
    accent: '#8B8CF5',
    primaryText: '#F4F4F6',
    secondaryText: '#A4A6B0',
    border: 'rgba(255, 255, 255, 0.08)',
    accentMuted: 'rgba(139, 140, 245, 0.16)',
    isDark: true,
  },
  {
    id: 'obsidian-emerald',
    name: 'Obsidian Emerald',
    description: 'Sleek dark forest with vibrant campus mint accent',
    background: '#101513',
    surface: '#19231E',
    card: '#26372E',
    accent: '#63C69B',
    primaryText: '#F0F5F1',
    secondaryText: '#9BAAA0',
    border: 'rgba(99, 198, 155, 0.15)',
    accentMuted: 'rgba(99, 198, 155, 0.16)',
    isDark: true,
  },
  {
    id: 'dark-plum',
    name: 'Dark Plum',
    description: 'Warm moody charcoal with signature rose-plum accent',
    background: '#121212',
    surface: '#211E1B',
    card: '#34302C',
    accent: '#C2526A',
    primaryText: '#F5F1E8',
    secondaryText: '#A9A198',
    border: 'rgba(194, 82, 106, 0.18)',
    accentMuted: 'rgba(194, 82, 106, 0.16)',
    isDark: true,
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Deep marine slate paired with electric cyan accent',
    background: '#0C1720',
    surface: '#142632',
    card: '#1D3645',
    accent: '#45B7D1',
    primaryText: '#ECF7FA',
    secondaryText: '#9BB8C2',
    border: 'rgba(69, 183, 209, 0.16)',
    accentMuted: 'rgba(69, 183, 209, 0.16)',
    isDark: true,
  },
  {
    id: 'warm-minimal',
    name: 'Warm Minimal',
    description: 'Refined editorial parchment with terracotta warmth',
    background: '#F6F3EE',
    surface: '#FFFFFF',
    card: '#EBE5DC',
    accent: '#D47750',
    primaryText: '#292622',
    secondaryText: '#81786E',
    border: 'rgba(41, 38, 34, 0.12)',
    accentMuted: 'rgba(212, 119, 80, 0.14)',
    isDark: false,
  },
  {
    id: 'lavender-light',
    name: 'Lavender Light',
    description: 'Clean airy lilac with royal purple highlights',
    background: '#F5F2FA',
    surface: '#FFFFFF',
    card: '#EAE4F4',
    accent: '#9274CF',
    primaryText: '#282334',
    secondaryText: '#88819A',
    border: 'rgba(146, 116, 207, 0.15)',
    accentMuted: 'rgba(146, 116, 207, 0.14)',
    isDark: false,
  },
];

const THEME_STORAGE_KEY = 'campus_connect_theme_id';

interface ThemeContextType {
  theme: CampusTheme;
  themeId: string;
  setThemeId: (id: string) => void;
  themes: CampusTheme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: CAMPUS_THEMES[0],
  themeId: 'midnight',
  setThemeId: () => {},
  themes: CAMPUS_THEMES,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && CAMPUS_THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'midnight';
  });

  const activeTheme = CAMPUS_THEMES.find((t) => t.id === themeId) || CAMPUS_THEMES[0];

  const setThemeId = (newId: string) => {
    if (CAMPUS_THEMES.some((t) => t.id === newId)) {
      setThemeIdState(newId);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newId);
      } catch (err) {
        console.debug('Failed to save theme in localStorage', err);
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cc-bg', activeTheme.background);
    root.style.setProperty('--cc-surface', activeTheme.surface);
    root.style.setProperty('--cc-card', activeTheme.card);
    root.style.setProperty('--cc-accent', activeTheme.accent);
    root.style.setProperty('--cc-text-primary', activeTheme.primaryText);
    root.style.setProperty('--cc-text-secondary', activeTheme.secondaryText);
    root.style.setProperty('--cc-border', activeTheme.border);
    root.style.setProperty('--cc-accent-muted', activeTheme.accentMuted);
    const contrast = activeTheme.id === 'obsidian-emerald' ? '#081a12' : '#ffffff';
    root.style.setProperty('--cc-accent-contrast', contrast);
    root.setAttribute('data-theme', activeTheme.id);

    if (activeTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themeId: activeTheme.id,
        setThemeId,
        themes: CAMPUS_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
