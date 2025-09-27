/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: '#0f172a',
        glass: 'rgba(255,255,255,0.08)',
        accent: '#38bdf8',
      },
      boxShadow: {
        soft: '0 25px 60px -35px rgba(15, 23, 42, 0.65)',
        glow: '0 0 30px rgba(56, 189, 248, 0.35)',
      },
      backgroundImage: {
        'vinyl-gradient':
          'radial-gradient(circle at top left, rgba(56,189,248,0.4), rgba(15,23,42,0.95))',
        'vinyl-gradient-alt':
          'radial-gradient(circle at bottom right, rgba(14,165,233,0.25), rgba(15,23,42,0.9))',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.glass-panel': {
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 20px 50px -30px rgba(15, 23, 42, 0.8)',
        },
        '.glass-border': {
          borderColor: 'rgba(255,255,255,0.12)',
        },
      })
    }),
  ],
}
