/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EFEEE6',
        ink: '#1E2A26',
        rule: '#C9CABB',
        forest: '#2F6F4F',
        forestDark: '#234F38',
        brick: '#A6432F',
        brickDark: '#7E3222',
        amber: '#B8842E',
        card: '#F8F7F1',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'ruled': 'repeating-linear-gradient(transparent, transparent 27px, #C9CABB 28px)',
      },
    },
  },
  plugins: [],
};