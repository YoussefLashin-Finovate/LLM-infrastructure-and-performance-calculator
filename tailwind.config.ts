import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 15s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Calibri', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
