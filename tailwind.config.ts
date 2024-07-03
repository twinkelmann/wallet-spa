import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}', './formkit.theme.ts'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
} as Config
