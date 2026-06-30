/** @type {import('tailwindcss').Config} */
module.exports = {
  // App is light-only until Settings theme toggle ships — avoids OS dark mode breaking contrast.
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Logo palette — Army olive (tri-service)
        army: {
          50: '#f4f7f0',
          100: '#e6eddc',
          200: '#cddbb9',
          300: '#adc292',
          400: '#8da86c',
          500: '#6B8244',
          600: '#556B2F',
          700: '#4A5D2E',
          800: '#3d5c2e',
          900: '#2E482E',
          950: '#1a2818',
        },
        // Cool blue-gray neutrals for in-app surfaces and text
        navy: {
          50: '#f5f7fa',
          100: '#e8ecf2',
          200: '#d1d9e4',
          300: '#a8b4c4',
          400: '#7a8a9e',
          500: '#5c6b7d',
          600: '#475569',
          700: '#334155',
          800: '#243548',
          900: '#1B2B3A',
          950: '#0f172a',
        },
        // Logo gold — CTAs, badges, highlights
        gold: {
          50: '#fdfaf0',
          100: '#faf3d9',
          200: '#f3e4a8',
          300: '#e8d078',
          400: '#dbbd4a',
          500: '#D4AF37',
          600: '#C9A227',
          700: '#a8871f',
          800: '#876b18',
          900: '#6b5412',
        },
        // Landing page — military premium palette (unchanged for landing)
        midnight: {
          950: '#0a1420',
          900: '#0D1B2A',
          800: '#152535',
          700: '#1B2B3A',
          600: '#243548',
        },
        olive: {
          950: '#1a2a1a',
          900: '#2E482E',
          800: '#3d5c2e',
          700: '#4A5D2E',
          600: '#556B2F',
        },
        signal: {
          400: '#e8c85a',
          500: '#D4AF37',
          600: '#C9A227',
        },
        // Air Force blue — links, focus, active nav, primary actions
        accent: {
          50: '#eff6fc',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3B82C4',
          600: '#2E6BA8',
          700: '#1e5a8a',
          800: '#1e4a6f',
          900: '#1a3a56',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
