/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { marigold: '#d58b3c', sindoor: '#a63b32', ink: '#30251f', cream: '#fbf7f0' }, fontFamily: { display: ['Playfair Display', 'serif'], sans: ['DM Sans', 'sans-serif'] } } },
  plugins: [],
}