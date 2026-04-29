'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors ${className}`}
    >
      {theme === 'dark'
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  );
}
