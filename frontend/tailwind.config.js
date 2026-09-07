/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens mapped to CSS variables
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        muted: 'var(--color-muted)',
        // Category colors
        cat: {
          organize: '#3b82f6',
          convert:  '#8b5cf6',
          security: '#ef4444',
          optimize: '#10b981',
        },
        // Brand color palette (used on LandingPage & CTA accents)
        brand: {
          50:  '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd0ff',
          300: '#8eb3ff',
          400: '#598aff',
          500: '#2d62ff',
          600: '#1a44f5',
          700: '#1431e1',
          800: '#1628b6',
          900: '#18278f',
        },
      },
      screens: {
        'xs': '420px',
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
        // keep old display for WorkspacePage logo
        display: ['Plus Jakarta Sans', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
