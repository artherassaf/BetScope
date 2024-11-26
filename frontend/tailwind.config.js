module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enables dark mode based on class
  theme: {
    extend: {
      colors: {
        lime: {
          400: '#3CB371', // Mint green for lighter accents
          500: '#3CB371', // Main mint green
          600: '#2ECC71', // Darker green for hover states
        },
        dark: {
          800: '#1E293B', // Lighter dark for navbar
          900: '#0F172A', // Dark background
        },
      },
      fontFamily: {
        sans: ['Raleway', 'Montserrat',],
      },
      backgroundImage: {
        gradient: 'linear-gradient(to bottom right, #1E293B, #0F172A)',
      },
    },
  },
  plugins: [],
};
