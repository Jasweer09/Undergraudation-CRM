/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#2563eb", // blue-600
          dark: "#e11d48"   // red-600
        }
      }
    }
  },
  plugins: []
}
