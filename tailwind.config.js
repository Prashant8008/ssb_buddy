/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        army: {
          50: '#f4f7f4',
          100: '#e5ebe5',
          200: '#cedbcd',
          300: '#a9bfab',
          400: '#7e9c81',
          500: '#5b7c5f',
          600: '#46624a',
          700: '#3a4f3d',
          800: '#304033',
          900: '#28352b',
          950: '#151d17',
        },
        navy: {
          50: '#f0f4f9',
          100: '#dee9f2',
          200: '#c2d6e8',
          300: '#97bad9',
          400: '#6697c5',
          500: '#4479ae',
          600: '#356193',
          700: '#2c4e78',
          800: '#284364',
          900: '#253a55',
          950: '#192639',
        },
        gold: {
          500: '#D4AF37',
          600: '#B8860B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    }
  },
  plugins: [],
};
