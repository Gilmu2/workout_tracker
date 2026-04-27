import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b1220',
        card: '#111a2e',
        border: '#1f2a44',
        accent: '#22d3ee',
        accentDark: '#0891b2',
        danger: '#f87171'
      }
    }
  },
  plugins: []
} satisfies Config
