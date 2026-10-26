import type { Config } from 'tailwindcss';

/**
 * Tailwind Configuration calibrated for strict WCAG AA+ Light Mode legibility (>= 4.5:1 on #FFFFFF and #F8FAFC)
 * across all cards, data tables, muted metadata, and semantic status indicators, while preserving luminous
 * dark-mode shades (-300 / -400) on obsidian surfaces.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          50: '#f8fafc',  // Light canvas subtle tint
          100: '#eef2f6', // Distinct table header & segmented bar surface against #FFFFFF
          200: '#cbd5e1', // Crisp structural card & table hairline border on #FFFFFF
          300: '#94a3b8', // Form control border in light mode; secondary text in dark mode (7.25:1 on #090d16)
          400: '#5b6b82', // 5.43:1 on #FFFFFF & 5.22:1 on #F8FAFC (WCAG AA compliant even for muted hints)
          500: '#3b495c', // 8.90:1 on #FFFFFF (WCAG AAA muted labels & metadata)
          600: '#273446', // 12.20:1 on #FFFFFF (secondary table cell copy)
          700: '#182232', // 15.40:1 on #FFFFFF (table column headers & primary labels)
          800: '#0f172a', // 17.85:1 on #FFFFFF
          900: '#090d16', // 19.40:1 on #FFFFFF
          950: '#05080f',
        },
        cyan: {
          500: '#087a98', // 5.09:1 with #FFFFFF
          600: '#0a6680', // 6.48:1 on #FFFFFF & with white CTA text
          700: '#085066', // 8.61:1 on #FFFFFF (table & card accent text)
          800: '#063d4e', // 11.40:1 on #FFFFFF
        },
        emerald: {
          600: '#046c4e', // 6.36:1 on #FFFFFF (financial positive & verified status)
          700: '#03543d', // 8.54:1 on #FFFFFF
        },
        amber: {
          600: '#944903', // 6.40:1 on #FFFFFF (pending & warning status)
          700: '#783a02', // 8.47:1 on #FFFFFF
        },
        blue: {
          600: '#1d4ed8', // 6.73:1 on #FFFFFF
          700: '#1e3fae', // 8.82:1 on #FFFFFF
        },
        indigo: {
          600: '#4338ca', // 7.61:1 on #FFFFFF
          700: '#3730a3', // 9.46:1 on #FFFFFF
        },
        purple: {
          600: '#6d28d9', // 6.95:1 on #FFFFFF
          700: '#5b21b6', // 8.90:1 on #FFFFFF
        },
        rose: {
          600: '#be123c', // 6.48:1 on #FFFFFF
          700: '#9f1239', // 8.33:1 on #FFFFFF
        },
        orange: {
          600: '#b44108', // 6.33:1 on #FFFFFF
          700: '#923406', // 8.25:1 on #FFFFFF
        },
        teal: {
          600: '#0b6961', // 6.40:1 on #FFFFFF
          700: '#08524c', // 8.50:1 on #FFFFFF
        },
      },
    },
  },
  plugins: [],
};

export default config;
