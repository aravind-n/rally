import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.97)' },
          '50%': { opacity: '0.55', transform: 'scale(1.04)' },
        },
        'orb-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(16px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        breathe: 'breathe 3s ease-in-out infinite',
        'orb-pulse': 'orb-pulse 0.8s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out both',
        'fade-up': 'fade-up 0.2s ease-out both',
      },
    },
  },
};

export default config;
