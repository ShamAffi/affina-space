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
      },
      keyframes: {
        'orb-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow:
              '0 0 0 0 rgba(147,51,234,0.45), 0 0 40px 8px rgba(147,51,234,0.18)',
          },
          '50%': {
            transform: 'scale(1.22)',
            boxShadow:
              '0 0 0 24px rgba(147,51,234,0), 0 0 90px 28px rgba(147,51,234,0.36)',
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
      },
    },
  },
  plugins: [],
};
