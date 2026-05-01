import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/data/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sanctuary: {
          blue: '#1A2A4F',
          DEFAULT: '#1A2A4F',
        },
        luma: {
          white: '#F5F7FA',
          DEFAULT: '#F5F7FA',
        },
        atmos: {
          glow: '#6EC9FF',
          DEFAULT: '#6EC9FF',
        },
        halo: {
          gold: '#E8C77A',
          DEFAULT: '#E8C77A',
        },
        nebula: {
          purple: '#7A5CFF',
          DEFAULT: '#7A5CFF',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        scripture: ['var(--font-cormorant)', 'serif'],
      }
    },
  },
  plugins: [],
};

export default config;
