/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./src/js/**/*.{js,jsx,ts,tsx}",
    "./src/js/components/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif']
      },
      colors: {
        'primary': '#4b0082',  // Indigo
        'secondary': '#6a0dad', // Purple
        'accent': '#A17FC0'    // Light purple
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
      scale: {
        '105': '1.05',
        '110': '1.10',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      lineClamp: {
        3: '3',
        4: '4',
      }
    }
  },
  plugins: [
    function({ addUtilities, addComponents }) {
      const newUtilities = {
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        },
        '.text-shadow-md': {
          'text-shadow': '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        },
        '.text-shadow-lg': {
          'text-shadow': '0 15px 30px rgba(0,0,0,0.11), 0 5px 15px rgba(0,0,0,0.08)',
        },
      };
      addUtilities(newUtilities);

      // Add custom components
      addComponents({
        '.glassmorphism': {
          'background': 'rgba(0, 0, 0, 0.5)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
        },
        '.media-card': {
          'position': 'relative',
          'overflow': 'hidden',
          'border-radius': '0.5rem',
          'transition': 'transform 0.3s ease',
          '&:hover': {
            'transform': 'scale(1.05)',
          },
        },
      });
    }
  ],
  darkMode: 'class'
}
