import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, isTransitioning } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      disabled={isTransitioning}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={
        `fixed bottom-4 right-4 z-50 group relative overflow-hidden ` +
        `flex items-center justify-center w-14 h-14 rounded-2xl ` +
        `transform transition-all duration-300 ease-out ` +
        `hover:scale-110 active:scale-95 ` +
        `disabled:opacity-70 disabled:cursor-not-allowed ` +
        (isDarkMode 
          ? `bg-gradient-to-br from-neutral-800 to-neutral-900 ` +
            `border border-neutral-600/50 text-neutral-100 ` +
            `shadow-glow hover:shadow-glow-lg ` +
            `hover:from-neutral-700 hover:to-neutral-800`
          : `bg-gradient-to-br from-neutral-0 to-neutral-100 ` +
            `border border-neutral-300/50 text-neutral-800 ` +
            `shadow-premium hover:shadow-premium-lg ` +
            `hover:from-neutral-50 hover:to-neutral-200`
        )
      }
    >
      {/* Background glow effect */}
      <div className={
        `absolute inset-0 rounded-2xl transition-opacity duration-300 ` +
        (isDarkMode
          ? `bg-gradient-to-br from-primary-600/20 to-secondary-600/20 opacity-0 group-hover:opacity-100`
          : `bg-gradient-to-br from-primary-400/10 to-secondary-400/10 opacity-0 group-hover:opacity-100`
        )
      } />
      
      {/* Icon container with rotation animation */}
      <div className={
        `relative z-10 transition-all duration-500 ease-out ` +
        `${isTransitioning ? 'rotate-180 scale-75' : 'rotate-0 scale-100'}`
      }>
        {isDarkMode ? (
          <SunIcon className={
            `w-7 h-7 transition-all duration-300 ` +
            `text-warning-400 drop-shadow-sm ` +
            `group-hover:text-warning-300 group-hover:scale-110`
          } />
        ) : (
          <MoonIcon className={
            `w-7 h-7 transition-all duration-300 ` +
            `text-primary-600 drop-shadow-sm ` +
            `group-hover:text-primary-700 group-hover:scale-110`
          } />
        )}
      </div>
      
      {/* Ripple effect */}
      <div className={
        `absolute inset-0 rounded-2xl transition-all duration-300 ` +
        `scale-0 group-active:scale-100 ` +
        (isDarkMode 
          ? `bg-neutral-700/30`
          : `bg-neutral-300/30`
        )
      } />
      
      {/* Tooltip */}
      <div className={
        `absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 ` +
        `px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ` +
        `opacity-0 group-hover:opacity-100 transition-all duration-200 ` +
        `pointer-events-none z-20 ` +
        (isDarkMode
          ? `bg-neutral-800 text-neutral-200 border border-neutral-600`
          : `bg-neutral-900 text-neutral-100 border border-neutral-700`
        )
      }>
        {isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        <div className={
          `absolute top-full left-1/2 transform -translate-x-1/2 ` +
          `w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ` +
          (isDarkMode 
            ? `border-t-neutral-800`
            : `border-t-neutral-900`
          )
        } />
      </div>
    </button>
  );
};

export default ThemeToggle;
