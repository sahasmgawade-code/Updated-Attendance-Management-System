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
        forestGlass: 'rgba(35, 79, 56, 0.88)',
        brickGlass: 'rgba(126, 50, 34, 0.88)',
        amberGlass: 'rgba(140, 100, 35, 0.88)',
        aero: '#3A8DA8',
        aeroDark: '#1F5C73',
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