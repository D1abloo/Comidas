/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bocado: {
          ink: '#0a0a0a',
          ink2: '#141414',
          house: '#1a2421',
          paper: '#FAF8F3',
          paper2: '#F1EEE6',
          ceramic: '#EDE9E3',
          cream: '#FFFDF8',
          lime: '#D6FF3D',
          lime2: '#C8F535',
          coral: '#FF6B4A',
          violet: '#7C3AED',
          line: '#E8E5DC',
          mute: '#6B6760',
          body: '#5e5e5e',
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        display: [
          'Fraunces',
          'Georgia',
          '"Times New Roman"',
          'serif',
        ],
        admin: [
          '"Plus Jakarta Sans"',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightish: '-0.01em',
        display: '-0.03em',
      },
      borderRadius: { '2xl': '20px', '3xl': '28px', '4xl': '36px', pill: '9999px' },
      boxShadow: {
        card: '0 1px 2px rgba(10,10,10,.04), 0 12px 40px -16px rgba(10,10,10,.1)',
        premium: '0 24px 64px -24px rgba(10,10,10,.18), 0 8px 20px -8px rgba(10,10,10,.08)',
        glow: '0 0 40px -8px rgba(214,255,61,.45)',
        fab: '0 0 6px rgba(0,0,0,.24), 0 8px 20px rgba(0,0,0,.18)',
        'card-lift': '0 2px 8px rgba(0,0,0,.06), 0 14px 32px -8px rgba(0,0,0,.12)',
      },
    },
  },
  plugins: [],
};
