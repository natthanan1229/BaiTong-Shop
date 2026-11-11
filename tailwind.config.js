/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#b2dfdb',
          tealLight: '#e0f2f1',
          tealDark: '#00796b',
          green: '#d0f8ce',
          greenLight: '#edfbe2',
          greenDark: '#2e7d32',
          brown: '#8d6e63',
          brownLight: '#d7ccc8',
          brownDark: '#4e342e',
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Sarabun', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
