import type { Config } from 'tailwindcss';

/**
 * Tailwind Config
 * Design System: Alpine Quiet Luxury 2030
 * 
 * Colors per DESIGN_SYSTEM_2030.md:
 * - Deep Alpine Navy #0B1626 (hero, dark sections)
 * - Warm Gold #C9A24D (CTA, accents)
 * - Stone Grey #F4F6F8 (backgrounds)
 * - Forest Green #1F2F2A (accent)
 * - Off-white #FAFAF7 (text blocks)
 */

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Deep Alpine Navy
        navy: {
          DEFAULT: '#0B1626',
          50: '#E8EBF0',
          100: '#C5CBD6',
          200: '#9EA8BA',
          300: '#77859E',
          400: '#506282',
          500: '#2A3F66',
          600: '#1A2B4A',
          700: '#0F1D33',
          800: '#0B1626',
          900: '#060B13',
        },
        // Accent: Warm Gold
        gold: {
          DEFAULT: '#C9A24D',
          50: '#FAF6ED',
          100: '#F3EBDA',
          200: '#E7D6B5',
          300: '#DBC290',
          400: '#D4B36E',
          500: '#C9A24D',
          600: '#B08A3A',
          700: '#8A6C2E',
          800: '#644E21',
          900: '#3E3015',
        },
        // Stone Grey (overrides Tailwind default)
        stone: {
          DEFAULT: '#F4F6F8',
          50: '#FFFFFF',
          100: '#FAFBFC',
          200: '#F4F6F8',
          300: '#E8ECF0',
          400: '#D1D8E0',
          500: '#B0BBC6',
          600: '#8A97A6',
          700: '#6B7A8C',
          800: '#4F5A66',
          900: '#333B42',
        },
        // Secondary: Forest Green (dark)
        forest: {
          DEFAULT: '#1F2F2A',
          50: '#E8EDEB',
          100: '#C5D1CC',
          200: '#9EB3AB',
          300: '#77958A',
          400: '#507769',
          500: '#2A5948',
          600: '#1F2F2A',
          700: '#172320',
          800: '#0F1715',
          900: '#080C0B',
        },
        // Off-white (text blocks)
        cream: {
          DEFAULT: '#FAFAF7',
          50: '#FFFFFF',
          100: '#FDFDFB',
          200: '#FAFAF7',
          300: '#F2F2EB',
          400: '#E5E5DA',
          500: '#D4D4C4',
        },
      },
      fontFamily: {
        // Primary: Fedra Sans Pro (fallback to Inter)
        sans: ['var(--font-fedra)', 'Inter', 'system-ui', 'sans-serif'],
        // Secondary: Bree Light (fallback to Georgia)
        display: ['var(--font-bree)', 'Georgia', 'serif'],
      },
      // Generous spacing for luxury feel
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
