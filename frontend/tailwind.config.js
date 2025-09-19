/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Indian Flag Colors
        saffron: {
          50: '#FFFBF7',
          100: '#FFF7ED',
          200: '#FFEFD6',
          300: '#FFDFAD',
          400: '#FFC97D',
          500: '#FF9933', // Primary saffron
          600: '#E6821A',
          700: '#CC6D14',
          800: '#A55A15',
          900: '#8B4D16',
        },
        white: '#FFFFFF',
        'off-white': '#FAFAFA',
        green: {
          50: '#F0F9F0',
          100: '#E0F2E0',
          200: '#C1E5C1',
          300: '#92D192',
          400: '#4CAF50',
          500: '#138808', // Primary green
          600: '#0F5C06',
          700: '#0C4A05',
          800: '#0A3D04',
          900: '#082F03',
        },
        // Neutral grays
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
        },
        // Status colors
        success: '#138808',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}