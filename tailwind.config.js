/** @type {import('tailwindcss').Config} */
export default {
 content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
 theme: { extend: {
  colors: { marigold:'#d58b3c', sindoor:'#a63b32', ink:'#30251f', cream:'#fbf7f0', forest:'#243a2d', gold:'#b58b35', sage:'#9da78b', ivory:'#f8f3e8' },
  fontFamily: { display:['Playfair Display','serif'], sans:['DM Sans','sans-serif'], serif:['Cormorant Garamond','Georgia','serif'], script:['Great Vibes','cursive'], arabic:['Amiri','serif'] }
 } },
 plugins: [],
}