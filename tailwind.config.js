import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#e6f7ff',
          100: '#b3e7ff',
          200: '#80d6ff',
          300: '#4dc6ff',
          400: '#1ab6ff',
          500: '#0099e6',
          600: '#0077b3',
          700: '#005580',
          800: '#00334d',
          900: '#00121a',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: '#e6f7ff',
              100: '#b3e7ff',
              200: '#80d6ff',
              300: '#4dc6ff',
              400: '#1ab6ff',
              500: '#3B82F6', // Updated to match design requirements
              600: '#2563EB',
              700: '#1D4ED8',
              800: '#1E40AF',
              900: '#1E3A8A',
              DEFAULT: '#3B82F6',
              foreground: '#ffffff'
            }
          }
        }
      }
    })
  ],
};