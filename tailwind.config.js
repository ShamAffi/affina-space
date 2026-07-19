/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // One family — Archivo variable (width + weight axes). display = heavy/tight, sans = body.
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Royal-purple brand (new spec) — 600 is the primary.
        brand: {
          50: '#F3EBFB',
          100: '#E7D6F7',
          200: '#CBA9EF',
          300: '#B27EEB',
          400: '#9A5CE6',
          500: '#843BE0',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
          DEFAULT: '#6D28D9',
        },
        accent: {
          50: '#E4F5EE',
          100: '#BEE9D8',
          400: '#34C48F',
          600: '#0F9D74',
          800: '#0A5E47',
          DEFAULT: '#0F9D74',
        },
        canvas: '#ECE9E2',      // warm bone, not white
        surface: '#FFFFFF',
        inset: '#E2DED4',
        hairline: '#D9D4C7',
        ink: '#0B0A08',         // near-black
        'ink-soft': '#55524B',
        'ink-mute': '#98948A',
      },
      borderRadius: {
        card: '16px',
        control: '8px',
        pill: '999px',
      },
      animation: {
        'orb-pulse': 'orb-pulse 1.8s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'doc-fly': 'doc-fly 0.75s cubic-bezier(0.4,0,0.2,1) forwards',
        'avatar-ping': 'avatar-ping 0.5s ease-out forwards',
        'panel-in': 'panel-in 0.3s ease-out',
      },
      keyframes: {
        'orb-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(109,40,217,0.45), 0 0 40px 8px rgba(109,40,217,0.18)',
          },
          '50%': {
            transform: 'scale(1.22)',
            boxShadow: '0 0 0 24px rgba(109,40,217,0), 0 0 90px 28px rgba(109,40,217,0.36)',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'doc-fly': {
          '0%':   { opacity: '1', transform: 'translate(0, 0) scale(1)' },
          '60%':  { opacity: '0.8', transform: 'translate(60px, -120px) scale(0.6)' },
          '100%': { opacity: '0', transform: 'translate(120px, -200px) scale(0.2)' },
        },
        'avatar-ping': {
          '0%':   { boxShadow: '0 0 0 0 rgba(109,40,217,0.6)' },
          '60%':  { boxShadow: '0 0 0 8px rgba(109,40,217,0.15)' },
          '100%': { boxShadow: '0 0 0 12px rgba(109,40,217,0)' },
        },
        'panel-in': {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
