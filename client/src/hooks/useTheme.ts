import { create } from 'zustand';
import { useEffect } from 'react';

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: 'system',
  setTheme: (theme) => {
    set({ theme });
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  },
  primaryColor: 'hsl(221, 91%, 60%)',
  setPrimaryColor: (color) => {
    set({ primaryColor: color });
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-foreground', `hsl(${color.split(' ')[0]} 20.5% 90.2%)`); // Example: adjust foreground based on primary
  },
}));

// Initialize theme and color on mount
function ThemeInitializer() {
  const { theme, primaryColor, setTheme, setPrimaryColor } = useTheme();

  useEffect(() => {
    // Apply initial theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(theme);
    }

    // Apply initial primary color
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-foreground', `hsl(${primaryColor.split(' ')[0]} 20.5% 90.2%)`);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(systemTheme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, primaryColor]);

  return null;
}

export { ThemeInitializer };