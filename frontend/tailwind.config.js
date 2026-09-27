import defaultTheme from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4efe4',
          100: '#e6dcc8',
          200: '#c9b896',
          700: '#1c2738',
          800: '#121a28',
          900: '#0b1220',
          950: '#070b12',
        },
        navy: {
          DEFAULT: '#1A365D',
          fg: '#f4efe4',
          700: '#234878',
          800: '#1A365D',
          900: '#132844',
          950: '#0D1B2A',
        },
        brand: {
          50: '#faf6eb',
          100: '#f3ead0',
          200: '#e6d4a0',
          300: '#d4b76a',
          400: '#c9a44a',
          500: '#b08a32',
          600: '#8f6e24',
          700: '#6d541c',
          800: '#4a3914',
          900: '#2c210c',
        },
        success: {
          50: '#E6F4EC',
          100: '#C6E6D4',
          200: '#9AD4B4',
          300: '#68C08D',
          400: '#3FA56E',
          500: '#2F855A',
          600: '#276E4B',
          700: '#1F573C',
          800: '#17412D',
          900: '#0F2B1E',
        },
        crimson: {
          500: '#8b1e2d',
          600: '#6e1624',
          700: '#54111c',
        },
        slate: {
          950: '#070b12',
        },
        member: {
          canvas: '#F4F7FC',
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B8DCFE',
          400: '#38BDF8',
          500: '#0284C7',
          600: '#1D72FE',
          700: '#155EEF',
        },
      },
      fontFamily: {
        sans: ['Barlow', ...defaultTheme.fontFamily.sans],
        display: ['Barlow', ...defaultTheme.fontFamily.sans],
        member: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        glow: '0 20px 50px rgba(176, 138, 50, 0.22)',
        command: '0 24px 60px rgba(7, 11, 18, 0.45)',
        member: '0 2px 12px rgba(100, 116, 139, 0.06)',
        memberSoft: '0 4px 20px -2px rgba(148, 163, 184, 0.12)',
        memberFloat: '0 10px 25px -5px rgba(29, 114, 254, 0.3)',
      },
      backgroundImage: {
        'grid-brand':
          'linear-gradient(rgba(201, 164, 74, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(201, 164, 74, 0.12) 1px, transparent 1px)',
        'command-radial':
          'radial-gradient(circle at top, rgba(201, 164, 74, 0.16), transparent 55%), linear-gradient(180deg, #0b1220 0%, #070b12 100%)',
      },
      letterSpacing: {
        command: '0.12em',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
