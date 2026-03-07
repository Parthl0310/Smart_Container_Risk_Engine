/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        navy: '#0F172A',
        background: '#F8FAFC',
        danger: '#EF4444',
        success: '#10B981',
        accent: '#F59E0B',
        card: '#FFFFFF',
        text: '#0F172A',
        secondary: '#64748B',
        border: '#E2E8F0',
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
