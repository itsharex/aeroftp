/**
 * Theme Hook - Manages light/dark/auto theme switching
 */

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'auto';

/**
 * Custom hook for theme management
 * Persists theme preference to localStorage
 * Supports auto mode that follows system preference
 */
export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('aeroftp-theme') as Theme;
        return saved || 'auto';
    });
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const updateDarkMode = () => {
            if (theme === 'auto') {
                setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
            } else {
                setIsDark(theme === 'dark');
            }
        };
        updateDarkMode();
        localStorage.setItem('aeroftp-theme', theme);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', updateDarkMode);
        return () => mediaQuery.removeEventListener('change', updateDarkMode);
    }, [theme]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    return { theme, setTheme, isDark };
};

/**
 * Theme Toggle Button Component
 */
interface ThemeToggleProps {
    theme: Theme;
    setTheme: (t: Theme) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
    const nextTheme = (): Theme => {
        const order: Theme[] = ['light', 'dark', 'auto'];
        return order[(order.indexOf(theme) + 1) % 3];
    };

    return (
        <button
            onClick={() => setTheme(nextTheme())}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title={`Theme: ${theme}`}
        >
            {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
        </button>
    );
};
