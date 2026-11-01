export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F5F4A',
          dark: '#164536',
          light: '#EAF1EE',
        },
        accent: {
          DEFAULT: '#1F5F4A',
          dark: '#164536',
          light: '#EAF1EE',
        },
        sand: {
          DEFAULT: '#F5F6F5',
          dark: '#ECEEEC',
        },
        ink: '#1E1E1C',
        muted: '#6B6B66',
        line: '#E3E5E3',
        danger: '#C0392B',
        success: '#2E7D4F',
        warning: '#C98A12',
      },
      fontFamily: {
        serif: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(30, 30, 28, 0.04), 0 4px 16px rgba(30, 30, 28, 0.05)',
      },
      maxWidth: {
        container: '1200px',
      },
    },
  },
  plugins: [],
};
