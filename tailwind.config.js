/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FAF6EF',
          soft: '#F3ECDF',
          line: '#E7DCC6',
        },
        emerald: {
          deep: '#0F3630',
          DEFAULT: '#1F5C52',
          soft: '#DCE9E4',
        },
        gold: {
          DEFAULT: '#C9A24B',
          light: '#E4CE8E',
          deep: '#9C7A2E',
        },
        wine: {
          DEFAULT: '#6E1E2E',
          soft: '#F3E4E6',
        },
        ink: '#1C1A17',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,26,23,0.04), 0 8px 24px -12px rgba(15,54,48,0.18)',
        lift: '0 12px 32px -12px rgba(15,54,48,0.32)',
      },
      borderRadius: {
        arch: '999px 999px 12px 12px',
      },
    },
  },
  plugins: [],
}
