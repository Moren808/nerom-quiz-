import React, { useEffect, useState } from 'react';
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react';

interface ThemeToggleProps {
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ soundEnabled, toggleSound }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={toggleSound}
        className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 text-primary-600 dark:text-primary-400 shadow-lg hover:shadow-primary-500/20 transition-all hover:scale-105 active:scale-95"
        aria-label="Toggle Sound"
      >
        {soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
      </button>
      
      <button
        onClick={toggleTheme}
        className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 text-primary-600 dark:text-primary-400 shadow-lg hover:shadow-primary-500/20 transition-all hover:scale-105 active:scale-95"
        aria-label="Toggle Dark Mode"
      >
        {darkMode ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </div>
  );
};