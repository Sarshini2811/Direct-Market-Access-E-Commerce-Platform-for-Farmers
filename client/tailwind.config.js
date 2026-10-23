/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f3', 100: '#e0ebe2', 200: '#c2d8c7', 300: '#96bb9f',
          400: '#679874', 500: '#457a54', 600: '#336142', 700: '#2a4e37',
          800: '#233f2e', 900: '#1c3325', 950: '#0e1c14',
        },
        leaf: {
          50: '#f3f9ee', 100: '#e4f1d9', 200: '#cbe3b6', 300: '#a9cf87',
          400: '#87ba5e', 500: '#6b9f42', 600: '#537f32', 700: '#41632a',
          800: '#364f25', 900: '#2e4221',
        },
        cream: { 50: '#fdfcf8', 100: '#faf7ee', 200: '#f3ecd8', 300: '#e9deb9' },
        earth: { 500: '#a97448', 600: '#8f5f39', 700: '#734b2e' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,51,37,0.06), 0 4px 14px rgba(28,51,37,0.06)',
      },
    },
  },
  plugins: [],
};
