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
        dark: {
          '950': '#0a0a0b',    // Fondo principal (más oscuro)
          '900': '#1a1a1b',    // Contenedores principales
          '850': '#1f1f20',    // Contenedores hover
          '800': '#272729',    // Elementos interactivos
          '750': '#2a2a2b',    // Bordes principales
          '700': '#343536',    // Bordes normales
          '650': '#3a3a3b',    // Bordes hover
          '600': '#4b5563',    // Separadores
          '500': '#6b7280',    // Texto secundario
          '400': '#9ca3af',    // Texto terciario
          '300': '#d1d5db',    // Texto normal
          '200': '#e5e7eb',    // Texto emphasis
          '100': '#f3f4f6',    // Texto alto contraste
        },
        accent: {
          'orange': '#ff4500',     // Naranja principal (video-editor)
          'green': '#22c55e',      // Verde principal (video-editor)
          'green-secondary': '#46d160', // Verde secundario
          'pink': '#ec4899',       // Rosa principal (slideshow)
          'pink-dark': '#be185d',  // Rosa oscuro
          'pink-light': '#f472b6', // Rosa claro
          'blue': '#60a5fa',       // Azul para controles
          'blue-dark': '#3b82f6',  // Azul oscuro
          'red': '#ef4444',        // Rojo para errores/eliminar
          'red-dark': '#dc2626',   // Rojo oscuro
        }
      },
      fontFamily: {
        'mono': ['"Space Mono"', '"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['10px', '14px'],
        'sm': ['11px', '16px'], 
        'base': ['12px', '18px'],
        'md': ['13px', '19px'],
        'lg': ['14px', '20px'],
        'xl': ['16px', '24px'],
        '2xl': ['18px', '28px'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
        'glow-orange': '0 0 20px rgba(255, 69, 0, 0.3)',
        'inner-subtle': 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      zIndex: {
        '20': '20',
        '25': '25',
        '26': '26',
        '30': '30',
        '31': '31',
        '32': '32',
      }
    },
  },
  plugins: [],
} 