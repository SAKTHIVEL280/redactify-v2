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
        'warm-bone': '#fafaf9',
        'paper-white': '#ffffff',
        'stone-mist': '#e7e5e4',
        'bark-grey': '#79716b',
        charcoal: '#292524',
        obsidian: '#0c0a09',
        pebble: '#a6a09b',
        'electric-indigo': '#18181b',
        'deep-violet': '#09090b',
        terracotta: '#d97757',
        'lichen-green': '#10b981',
        'tide-teal': '#22b8cd',
        'alarm-red': '#ef4444',
        'sapphire-link': '#2563eb',
        brand: {
          500: '#18181b',
          600: '#09090b',
        }
      },
      borderRadius: {
        'card': '16px',
        'pill': '9999px',
        'tag': '8px',
        'input': '12px',
        'button': '8px',
      },
      boxShadow: {
        'showcase': 'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px',
        'card': 'rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
      },
      fontFamily: {
        serif: ['"Cooper LtBT"', 'Fraunces', 'Playfair Display', 'Cormorant Garamond', 'Lora', 'Georgia', 'serif'],
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        datatype: ['dataType', '"Geist Mono"', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
