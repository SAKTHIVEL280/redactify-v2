/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        linen: '#edede8',
        frosted: '#ffffff',
        'stone-warm': '#dbdbd2',
        'stone-quartz': '#d0d0c8',
        pebble: '#c0c0c0',
        graphite: '#141414',
        charcoal: '#292929',
        iron: '#353535',
        'slate-caption': '#6f6f6e',
        ash: '#8f8f8e',
        'lime-pulse': '#4cc02b',
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        }
      },
      borderRadius: {
        'card': '12px',
        'pill': '200px',
        'tile': '6px',
        'element': '3.75px',
      },
      boxShadow: {
        'studio': 'rgba(0, 0, 0, 0.04) 0px 4px 16px 0px',
        'studio-lg': 'rgba(16, 24, 40, 0.08) 0px 18px 55px 0px',
        'paper': 'rgba(0, 0, 0, 0.06) 0px 2px 8px 0px',
      },
      fontFamily: {
        sans: ['Switzer', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace']
      }
    },
  },
  plugins: [],
}
