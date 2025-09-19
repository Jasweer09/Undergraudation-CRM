import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import Link from "next/link";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-light dark:bg-brand-dark rounded-full flex items-center justify-center font-bold text-white">
            UG
          </div>
          <div>
            <div className="text-sm font-semibold">Undergraduation CRM</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Internal dashboard</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">

          <Link
            href="/communications"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            title="Communication Tools"
          >
            {/* SVG chat/phone hybrid icon */}
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
              <path strokeWidth="2" d="M8 10h8M8 14h6" />
              <path strokeWidth="2" d="M21 15a2 2 0 01-2 2H8l-5 5V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Communication
          </Link>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5 text-gray-800" />
            ) : (
              <SunIcon className="w-5 h-5 text-yellow-400" />
            )}
          </button>

          
        </div>
      </div>
    </header>
  );
}
