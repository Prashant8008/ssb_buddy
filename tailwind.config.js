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
        // Muted sage — primary natural accent (links, CTAs, active states)
        army: {
          50: '#f6f7f4',
          100: '#eaede6',
          200: '#d8dfd0',
          300: '#b8c4ad',
          400: '#93a388',
          500: '#728568',
          600: '#5a6b52',
          700: '#485641',
          800: '#3c4637',
          900: '#333c30',
          950: '#1a2018',
        },
        // Warm stone — neutral text, surfaces, borders (not blue)
        navy: {
          50: '#faf9f7',
          100: '#f3f1ec',
          200: '#e8e4dc',
          300: '#d5cfc4',
          400: '#a39b8f',
          500: '#7a7268',
          600: '#635c53',
          700: '#504a43',
          800: '#3f3a35',
          900: '#2e2a26',
          950: '#1a1816',
        },
        // Wheat / clay — warm secondary accent
        gold: {
          50: '#faf8f4',
          100: '#f3ede3',
          200: '#e6d9c6',
          300: '#d4c0a4',
          400: '#c2a67e',
          500: '#a8895c',
          600: '#8f7049',
          700: '#755a3c',
        },
        // Landing page — military premium palette
        midnight: {
          950: '#0a1420',
          900: '#0D1B2A',
          800: '#122640',
          700: '#1a3050',
          600: '#243d5c',
        },
        olive: {
          950: '#1a2a1a',
          900: '#2E482E',
          800: '#3a5a3a',
          700: '#466b46',
          600: '#527c52',
        },
        signal: {
          400: '#f7d066',
          500: '#F5C542',
          600: '#d4a832',
        },
        // App UI highlights — light blue (links, focus, active nav, CTAs)
        accent: {
          50: '#eff9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
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
