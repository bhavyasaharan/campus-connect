/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
        accent: {
          DEFAULT: 'var(--cc-accent)',
          500: 'var(--cc-accent)',
          600: 'var(--cc-accent)',
        },
        cc: {
          bg: 'var(--cc-bg)',
          surface: 'var(--cc-surface)',
          card: 'var(--cc-card)',
          accent: 'var(--cc-accent)',
          'accent-muted': 'var(--cc-accent-muted)',
          'text-primary': 'var(--cc-text-primary)',
          'text-secondary': 'var(--cc-text-secondary)',
          border: 'var(--cc-border)',
        }
      },
    },
  },
  plugins: [],
}
