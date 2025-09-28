
// Helper to determine best foreground color (white or dark) for contrast
function getPrimaryForeground(primary, isDark) {
  // Use white for dark backgrounds, dark for light backgrounds
  if (isDark) {
    return 'hsl(210, 40%, 98%)';
  } else {
    return 'hsl(210, 10%, 15%)';
  }
}

// Helper to update sidebar CSS variables for correct contrast
function updateSidebarColors(theme, primaryColor) {
  // Always set sidebar background and text for best contrast
  if (theme === 'dark') {
    document.documentElement.style.setProperty('--sidebar', 'hsl(215, 28%, 17%)');
    document.documentElement.style.setProperty('--sidebar-foreground', 'hsl(210, 17%, 98%)');
    document.documentElement.style.setProperty('--sidebar-primary', primaryColor);
    document.documentElement.style.setProperty('--sidebar-primary-foreground', 'hsl(210, 40%, 98%)');
  } else {
    document.documentElement.style.setProperty('--sidebar', 'hsl(0, 0%, 100%)');
    document.documentElement.style.setProperty('--sidebar-foreground', 'hsl(210, 10%, 15%)');
    document.documentElement.style.setProperty('--sidebar-primary', primaryColor);
    document.documentElement.style.setProperty('--sidebar-primary-foreground', 'hsl(210, 40%, 98%)');
  }
}
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
    let appliedTheme = theme;
    if (theme === 'system') {
      appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(appliedTheme);
    // Also update sidebar variables for correct contrast
    updateSidebarColors(appliedTheme, useTheme.getState().primaryColor);
  },
  primaryColor: 'hsl(221, 91%, 60%)',
  setPrimaryColor: (color) => {
    set({ primaryColor: color });
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-foreground', getPrimaryForeground(color, document.documentElement.classList.contains('dark')));
    // Also update sidebar variables for correct contrast
    updateSidebarColors(document.documentElement.classList.contains('dark') ? 'dark' : 'light', color);
  },

}));

// Initialize theme and color on mount
function ThemeInitializer() {
  const { theme, primaryColor, setTheme, setPrimaryColor } = useTheme();

  useEffect(() => {
    // Apply initial theme
    let appliedTheme = theme;
    if (theme === 'system') {
      appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(appliedTheme);

    // Apply initial primary color
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-foreground', getPrimaryForeground(primaryColor, appliedTheme === 'dark'));
    updateSidebarColors(appliedTheme, primaryColor);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(systemTheme);
        updateSidebarColors(systemTheme, useTheme.getState().primaryColor);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, primaryColor]);

  return null;
}

export { ThemeInitializer };