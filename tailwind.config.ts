import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        japan: {
          crimson: '#DC2626',
          dark: '#991B1B',
          light: '#F87171',
        },
        adb: {
          blue: '#2563EB',
          dark: '#1E40AF',
          light: '#60A5FA',
        },
      },
    },
  },
  plugins: [],
};

export default config;