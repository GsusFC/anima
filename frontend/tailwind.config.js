/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          '900': '#0a0a0b',
          '800': '#1a1a1b',
          '700': '#272729',
          '600': '#343536',
          '500': '#818384',
          '400': '#d7dadc',
        },
        accent: {
          'primary': '#ff4500',
          'secondary': '#46d160',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} 