import type { Config } from 'tailwindcss';
import { colors, fonts, fontSize, spacing, borderRadius, shadows } from './lib/design-system';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        newspaper: colors.newspaper,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
        gray: colors.gray,
      },
      fontFamily: {
        sans: fonts.sans,
        serif: fonts.serif,
        mono: fonts.mono,
      },
      fontSize,
      spacing,
      borderRadius,
      boxShadow: shadows,
    },
  },
  plugins: [],
};

export default config;
