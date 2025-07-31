// Theme management utilities
const THEME_KEY = 'shopfusion_theme';

export const applyTheme = (themeName) => {
  const root = document.documentElement;
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Determine the actual theme to apply
  const theme = themeName === 'system' ? (isSystemDark ? 'dark' : 'light') : themeName;

  // Add theme class to root element
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);

  // Store the user's preference
  localStorage.setItem(THEME_KEY, themeName);
};

export const initializeTheme = () => {
  // Get user's saved preference
  const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(savedTheme);

  // Watch for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addListener(() => {
    if (localStorage.getItem(THEME_KEY) === 'system') {
      applyTheme('system');
    }
  });
};

export const getStoredTheme = () => {
  return localStorage.getItem(THEME_KEY) || 'system';
};
