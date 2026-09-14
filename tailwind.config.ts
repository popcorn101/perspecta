import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F3EE',
        parchment: {
          50: '#FAF7F2',
          100: '#F7F3EE',
          200: '#EFE8DF',
          300: '#E6DDD2',
          400: '#D8CFC4',
          500: '#BDB3A6',
        },
        ink: {
          primary: '#241E19',
          secondary: '#5D544C',
          muted: '#7C7167',
          faint: '#A3998E',
        },
        terracotta: {
          DEFAULT: '#9E4A28',
          hover: '#B85934',
          deep: '#7F3313',
          light: '#F9EFEA',
          border: '#E8B6A2',
        },
        // PRISM Category Tints
        prism: {
          attribution: {
            text: '#8C531B',
            bg: '#FDF6EC',
            border: '#E8D4BE',
            highlight: 'rgba(253, 246, 236, 0.9)',
          },
          evaluative: {
            text: '#9E4A28',
            bg: '#F9EFEA',
            border: '#E8B6A2',
            highlight: 'rgba(249, 239, 234, 0.95)',
          },
          certainty: {
            text: '#A66B24',
            bg: '#FAF3EA',
            border: '#E8D4BE',
            highlight: 'rgba(250, 243, 234, 0.95)',
          },
          claims: {
            text: '#434D80',
            bg: '#EEF0F8',
            border: '#BCC2E2',
            highlight: 'rgba(238, 240, 248, 0.95)',
          },
          primacy: {
            text: '#3B6B56',
            bg: '#EBF1EE',
            border: '#B9D5C8',
            highlight: 'rgba(235, 241, 238, 0.95)',
          },
          omission: {
            text: '#3C567A',
            bg: '#ECF1F6',
            border: '#B6CBDE',
            highlight: 'rgba(236, 241, 246, 0.95)',
          },
          emotional: {
            text: '#7D374B',
            bg: '#F6ECF0',
            border: '#DFBAC5',
            highlight: 'rgba(246, 236, 240, 0.95)',
          },
        },
      },
      fontFamily: {
        serif: ['var(--font-newsreader)', 'Newsreader', 'Georgia', 'serif'],
        sans: ['var(--font-hanken)', 'Hanken Grotesk', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Hanken Grotesk', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px crisp print edge
        sm: '0.125rem',     // 2px
        md: '0.375rem',     // 6px
        lg: '0.5rem',       // 8px
      },
      boxShadow: {
        'paper-sm': '0 1px 2px 0 rgba(36, 30, 25, 0.04)',
        'paper-md': '0 4px 16px -2px rgba(36, 30, 25, 0.08), 0 1px 3px 0 rgba(36, 30, 25, 0.04)',
        'paper-lg': '0 12px 32px -4px rgba(36, 30, 25, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
