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
