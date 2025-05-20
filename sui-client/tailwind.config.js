/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,tsx,ts}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      // '2xl': '1536px',
    },
    extend: {
      container: {
        center: true,
      },
      colors: {
        'gold-f': '#FF6B00',
        'gold-t': '#F8E004',
        'gray-10': '#011024',
        'gray-9': '#2A2D3A',
        'gray-8': '#2D2E36',
        'gray-5': '#606064',
        'gray-3': '#B9C1D9',
      },
    },
  },
  plugins: [],
  corePlugins: {
    outlineStyle: false,
  },
}
