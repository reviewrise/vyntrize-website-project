'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
    theme: 'light',
    toggle: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const stored = localStorage.getItem('crm-theme') as Theme | null;
        const resolved = stored ?? 'light';
        setTheme(resolved);
        document.documentElement.setAttribute('data-theme', resolved);
    }, []);

    function toggle() {
        const next: Theme = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('crm-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeToggle() {
    const { theme, toggle } = useTheme();
    return (
        <button
            onClick={toggle}
            className="btn-ghost h-8 w-8 p-0 flex items-center justify-center rounded-lg"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
            {theme === 'light'
                ? <Moon className="h-4 w-4" />
                : <Sun className="h-4 w-4" />
            }
        </button>
    );
}
