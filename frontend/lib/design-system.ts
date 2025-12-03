// Design System for MyRSSPress
// This file defines the core design tokens used throughout the application

export const colors = {
  // Brand colors (newspaper theme)
  primary: {
    50: '#f9f9f9',
    100: '#f4f1e8',      // Newspaper yellow
    500: '#000000',      // Black (main color)
    600: '#1a1a1a',
    700: '#333333',
  },
  
  // Newspaper theme colors
  newspaper: {
    paper: '#f4f1e8',      // Paper color (newspaper yellow)
    ink: '#000000',        // Ink color (pure black)
    border: '#000000',     // Border (pure black)
    accent: '#333333',     // Accent (dark gray)
  },
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const fonts = {
  // UI fonts (newspaper style - serif by default)
  sans: ['Georgia', 'Times New Roman', 'serif'],
  
  // Newspaper fonts (primary)
  serif: ['Georgia', 'Times New Roman', 'serif'],
  
  // Code fonts
  mono: ['Courier New', 'monospace'],
};

export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
};

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
};

export const borderRadius = {
  none: '0',        // Newspaper style - no rounded corners
  sm: '0',
  DEFAULT: '0',
  md: '0',
  lg: '0',
  xl: '0',
  '2xl': '0',
  '3xl': '0',
  full: '0',        // Even "full" is square for newspaper aesthetic
};

export const shadows = {
  sm: '2px 2px 0 rgb(0 0 0 / 0.2)',
  DEFAULT: '3px 3px 0 rgb(0 0 0 / 0.3)',
  md: '4px 4px 0 rgb(0 0 0 / 0.4)',
  lg: '6px 6px 0 rgb(0 0 0 / 0.5)',
  xl: '8px 8px 0 rgb(0 0 0 / 0.6)',
  '2xl': '12px 12px 0 rgb(0 0 0 / 0.7)',
  inner: 'inset 2px 2px 0 rgb(0 0 0 / 0.1)',
  none: 'none',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Export the complete design system
export const designSystem = {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
};

export default designSystem;
