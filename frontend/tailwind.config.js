/** Design tokens copied from the Figma file's color variables and text styles. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: '#faf8f5',        // bg
        surface: '#ffffff',
        alt: '#f2eee7',         // surface-alt
        line: '#e5e0d6',        // border
        strong: '#d3ccbf',      // border-strong
        ink: '#1c1b19',         // text
        muted: '#6b665d',       // text-muted
        subtle: '#9a948a',      // text-subtle
        accent: { DEFAULT: '#b4532a', hover: '#96421f', soft: '#f6e7df' },
        success: { DEFAULT: '#2f7d4f', soft: '#e3f1e8' },
        warning: { DEFAULT: '#a86a12', soft: '#fbf0dc' },
        danger: { DEFAULT: '#b42318', soft: '#fbe6e4' },
        sidebar: { DEFAULT: '#1c1b19', hover: '#2b2926', text: '#cfc9be' },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['Literata', 'Georgia', 'serif'],
      },
      borderRadius: { DEFAULT: '6px', lg: '8px', xl: '12px' },
      boxShadow: { card: '0 1px 2px rgba(28,27,25,.04)', pop: '0 12px 32px rgba(28,27,25,.14)' },
    },
  },
  plugins: [],
};
