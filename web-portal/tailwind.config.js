/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tenant: {
          primary: 'var(--tenant-primary)',
          secondary: 'var(--tenant-secondary)',
          accent: '#E8832A', // Naranja para botón imperativo móvil / acento
        },
        enterprise: {
          950: '#090C10', // Fondo raíz ultralimpio
          900: '#0D1117', // Fondo secundario
          800: '#161D27', // Superficie de tarjetas / tablas
          700: '#212A38', // Bordes corporativos
          600: '#303B4E', // Elementos interactivos hover
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
