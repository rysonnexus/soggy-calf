/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        tavern: {
          dark: '#1a1208',
          brown: '#3d2b1f',
          amber: '#c8922a',
          gold: '#f0c040',
          parchment: '#f5e6c8',
          muted: '#8b7355',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
