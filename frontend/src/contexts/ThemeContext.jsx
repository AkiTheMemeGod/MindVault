import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Add theme transition class
    document.documentElement.classList.add('theme-transitioning');
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    setIsDarkMode(prev => !prev);
  };

  // Professional color palette with comprehensive theming
  const theme = {
    // Core brand colors
    brand: {
      primary: isDarkMode ? 'text-primary-400' : 'text-primary-600',
      secondary: isDarkMode ? 'text-secondary-400' : 'text-secondary-600',
      tertiary: isDarkMode ? 'text-tertiary-400' : 'text-tertiary-600',
    },

    // Background colors with professional gradients
    bg: {
      // Base backgrounds
      primary: isDarkMode ? 'bg-neutral-950' : 'bg-neutral-0',
      secondary: isDarkMode ? 'bg-neutral-900' : 'bg-neutral-50',
      tertiary: isDarkMode ? 'bg-neutral-850' : 'bg-neutral-100',
      accent: isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200',
      
      // Special surfaces
      surface: isDarkMode ? 'bg-neutral-925/80' : 'bg-neutral-0/80',
      elevated: isDarkMode ? 'bg-neutral-850/95' : 'bg-neutral-50/95',
      
      // Glass morphism effects
      glass: isDarkMode 
        ? 'bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50' 
        : 'bg-neutral-0/80 backdrop-blur-xl border border-neutral-200/50',
      
      glassDark: isDarkMode
        ? 'bg-neutral-925/90 backdrop-blur-2xl border border-neutral-700/30'
        : 'bg-neutral-50/90 backdrop-blur-2xl border border-neutral-300/30',
      
      // Premium gradients
      gradient: isDarkMode 
        ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-925' 
        : 'bg-gradient-to-br from-neutral-0 via-neutral-50 to-primary-50/30',
      
      gradientPremium: isDarkMode
        ? 'bg-gradient-to-br from-neutral-950 via-primary-950/20 to-secondary-950/20'
        : 'bg-gradient-to-br from-primary-50/50 via-secondary-50/30 to-tertiary-50/20',
      
      // Accent gradients
      gradientPrimary: isDarkMode
        ? 'bg-gradient-to-r from-primary-900 to-primary-800'
        : 'bg-gradient-to-r from-primary-500 to-primary-600',
      
      gradientSecondary: isDarkMode
        ? 'bg-gradient-to-r from-secondary-900 to-secondary-800'
        : 'bg-gradient-to-r from-secondary-500 to-secondary-600',
      
      // Interactive states
      hover: isDarkMode ? 'hover:bg-neutral-800/80' : 'hover:bg-neutral-100/80',
      active: isDarkMode ? 'active:bg-neutral-700/80' : 'active:bg-neutral-200/80',
    },
    
    // Text colors with semantic meaning
    text: {
      // Hierarchy
      primary: isDarkMode ? 'text-neutral-50' : 'text-neutral-900',
      secondary: isDarkMode ? 'text-neutral-300' : 'text-neutral-700',
      tertiary: isDarkMode ? 'text-neutral-400' : 'text-neutral-600',
      quaternary: isDarkMode ? 'text-neutral-500' : 'text-neutral-500',
      muted: isDarkMode ? 'text-neutral-600' : 'text-neutral-400',
      
      // Brand colors
      brand: isDarkMode ? 'text-primary-400' : 'text-primary-600',
      brandSecondary: isDarkMode ? 'text-secondary-400' : 'text-secondary-600',
      
      // Interactive states
      interactive: isDarkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700',
      link: isDarkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700',
      
      // Status colors
      success: isDarkMode ? 'text-success-400' : 'text-success-600',
      warning: isDarkMode ? 'text-warning-400' : 'text-warning-600',
      error: isDarkMode ? 'text-error-400' : 'text-error-600',
      info: isDarkMode ? 'text-tertiary-400' : 'text-tertiary-600',
      
      // Special effects
      glow: isDarkMode ? 'text-primary-300 drop-shadow-glow' : 'text-primary-700',
      gradient: 'bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 bg-clip-text text-transparent',
    },
    
    // Border colors
    border: {
      primary: isDarkMode ? 'border-neutral-800' : 'border-neutral-200',
      secondary: isDarkMode ? 'border-neutral-700' : 'border-neutral-300',
      tertiary: isDarkMode ? 'border-neutral-600' : 'border-neutral-400',
      
      // Brand borders
      brand: isDarkMode ? 'border-primary-800' : 'border-primary-200',
      brandSecondary: isDarkMode ? 'border-secondary-800' : 'border-secondary-200',
      
      // Interactive states
      interactive: isDarkMode 
        ? 'border-neutral-700 hover:border-primary-700' 
        : 'border-neutral-300 hover:border-primary-300',
      
      // Status colors
      success: isDarkMode ? 'border-success-800' : 'border-success-200',
      warning: isDarkMode ? 'border-warning-800' : 'border-warning-200',
      error: isDarkMode ? 'border-error-800' : 'border-error-200',
    },
    
    // Button system with multiple variants
    button: {
      // Primary buttons
      primary: isDarkMode 
        ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white border border-primary-500 shadow-glow transition-all duration-200'
        : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white border border-primary-600 shadow-lg hover:shadow-xl transition-all duration-200',
      
      primaryGhost: isDarkMode
        ? 'text-primary-400 hover:bg-primary-900/50 border border-primary-800 hover:border-primary-700 transition-all duration-200'
        : 'text-primary-600 hover:bg-primary-50 border border-primary-200 hover:border-primary-300 transition-all duration-200',
      
      // Secondary buttons
      secondary: isDarkMode 
        ? 'bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-100 border border-neutral-700 transition-all duration-200'
        : 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-900 border border-neutral-200 transition-all duration-200',
      
      secondaryGhost: isDarkMode
        ? 'text-neutral-300 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition-all duration-200'
        : 'text-neutral-700 hover:bg-neutral-100 border border-neutral-300 hover:border-neutral-400 transition-all duration-200',
      
      // Accent buttons
      accent: isDarkMode
        ? 'bg-secondary-600 hover:bg-secondary-700 text-white border border-secondary-500 shadow-glow-purple transition-all duration-200'
        : 'bg-secondary-600 hover:bg-secondary-700 text-white border border-secondary-600 shadow-lg hover:shadow-xl transition-all duration-200',
      
      // Ghost/minimal buttons
      ghost: isDarkMode 
        ? 'text-neutral-300 hover:bg-neutral-800/60 hover:text-neutral-100 transition-all duration-200' 
        : 'text-neutral-600 hover:bg-neutral-100/60 hover:text-neutral-900 transition-all duration-200',
      
      // Success/Warning/Error buttons
      success: isDarkMode
        ? 'bg-success-600 hover:bg-success-700 text-white border border-success-500 transition-all duration-200'
        : 'bg-success-600 hover:bg-success-700 text-white border border-success-600 transition-all duration-200',
      
      warning: isDarkMode
        ? 'bg-warning-600 hover:bg-warning-700 text-white border border-warning-500 transition-all duration-200'
        : 'bg-warning-600 hover:bg-warning-700 text-white border border-warning-600 transition-all duration-200',
      
      error: isDarkMode
        ? 'bg-error-600 hover:bg-error-700 text-white border border-error-500 transition-all duration-200'
        : 'bg-error-600 hover:bg-error-700 text-white border border-error-600 transition-all duration-200',
    },
    
    // Input system
    input: {
      base: isDarkMode 
        ? 'bg-neutral-900 border-neutral-700 text-neutral-100 placeholder-neutral-500' 
        : 'bg-neutral-0 border-neutral-300 text-neutral-900 placeholder-neutral-500',
      
      focus: isDarkMode 
        ? 'focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 focus:bg-neutral-850' 
        : 'focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 focus:bg-neutral-50',
      
      error: isDarkMode
        ? 'border-error-600 focus:border-error-500 focus:ring-error-500/20'
        : 'border-error-500 focus:border-error-600 focus:ring-error-600/20',
      
      success: isDarkMode
        ? 'border-success-600 focus:border-success-500 focus:ring-success-500/20'
        : 'border-success-500 focus:border-success-600 focus:ring-success-600/20',
    },
    
    // Chat system with enhanced styling
    chat: {
      user: {
        bg: isDarkMode 
          ? 'bg-gradient-to-br from-primary-600 to-primary-700 border border-primary-500/50' 
          : 'bg-gradient-to-br from-primary-500 to-primary-600 border border-primary-400/50',
        text: 'text-white',
        shadow: 'shadow-premium'
      },
      assistant: {
        bg: isDarkMode 
          ? 'bg-neutral-850/80 backdrop-blur-sm border border-neutral-700/50' 
          : 'bg-neutral-0/80 backdrop-blur-sm border border-neutral-200/50 shadow-sm',
        text: isDarkMode ? 'text-neutral-100' : 'text-neutral-900',
        shadow: isDarkMode ? 'shadow-glass-dark' : 'shadow-glass'
      },
      system: {
        bg: isDarkMode 
          ? 'bg-secondary-950/50 border border-secondary-800/50' 
          : 'bg-secondary-50/50 border border-secondary-200/50',
        text: isDarkMode ? 'text-secondary-300' : 'text-secondary-700'
      }
    },
    
    // Component-specific theming
    pdf: {
      viewer: {
        bg: isDarkMode ? 'bg-neutral-925' : 'bg-neutral-50',
        panel: isDarkMode ? 'bg-neutral-900/95 backdrop-blur-xl' : 'bg-neutral-0/95 backdrop-blur-xl',
        header: isDarkMode ? 'bg-neutral-850 border-b border-neutral-700' : 'bg-neutral-100 border-b border-neutral-200',
        controls: isDarkMode ? 'bg-neutral-800 border-b border-neutral-700' : 'bg-neutral-200 border-b border-neutral-300',
        content: isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100',
      }
    },
    
    // Status and feedback colors
    status: {
      success: {
        bg: isDarkMode ? 'bg-success-950/50' : 'bg-success-50',
        text: isDarkMode ? 'text-success-400' : 'text-success-700',
        border: isDarkMode ? 'border-success-800' : 'border-success-200',
      },
      warning: {
        bg: isDarkMode ? 'bg-warning-950/50' : 'bg-warning-50',
        text: isDarkMode ? 'text-warning-400' : 'text-warning-700',
        border: isDarkMode ? 'border-warning-800' : 'border-warning-200',
      },
      error: {
        bg: isDarkMode ? 'bg-error-950/50' : 'bg-error-50',
        text: isDarkMode ? 'text-error-400' : 'text-error-700',
        border: isDarkMode ? 'border-error-800' : 'border-error-200',
      },
      info: {
        bg: isDarkMode ? 'bg-tertiary-950/50' : 'bg-tertiary-50',
        text: isDarkMode ? 'text-tertiary-400' : 'text-tertiary-700',
        border: isDarkMode ? 'border-tertiary-800' : 'border-tertiary-200',
      },
    },
    
    // Effects and animations
    effects: {
      glow: isDarkMode ? 'shadow-glow' : 'shadow-lg',
      glowStrong: isDarkMode ? 'shadow-glow-lg' : 'shadow-xl',
      glowPurple: isDarkMode ? 'shadow-glow-purple' : 'shadow-lg',
      premium: isDarkMode ? 'shadow-premium-lg' : 'shadow-premium',
      glass: isDarkMode ? 'shadow-glass-dark' : 'shadow-glass',
    }
  };

  const value = {
    isDarkMode,
    isTransitioning,
    toggleTheme,
    theme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
