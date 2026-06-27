/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
            boxShadow: '0 0 0 0 rgba(147,51,234,0.45), 0 0 40px 8px rgba(147,51,234,0.18)',
          },
          '50%': {
            transform: 'scale(1.22)',
            boxShadow: '0 0 0 24px rgba(147,51,234,0), 0 0 90px 28px rgba(147,51,234,0.36)',
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
          '0%':   { boxShadow: '0 0 0 0 rgba(147,51,234,0.6)' },
          '60%':  { boxShadow: '0 0 0 8px rgba(147,51,234,0.15)' },
          '100%': { boxShadow: '0 0 0 12px rgba(147,51,234,0)' },
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
