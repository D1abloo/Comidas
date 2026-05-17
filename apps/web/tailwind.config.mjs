/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bocado: {
          ink: '#0a0a0a',
          paper: '#FAF8F3',
          paper2: '#F1EEE6',
          lime: '#D6FF3D',
          coral: '#FF6B4A',
          violet: '#7C3AED',
          line: '#E8E5DC',
          mute: '#7A7670',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
        admin: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '20px', '3xl': '28px' },
      boxShadow: {
        card: '0 1px 2px rgba(10,10,10,.04), 0 8px 24px -16px rgba(10,10,10,.08)',
      },
    },
  },
  plugins: [],
};
