/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f5f7f2",
        muted: "#9aa39a",
        night: "#080b0a",
        panel: "#101510",
        line: "#242c24",
        accent: "#1ed760"
      },
      boxShadow: {
        glow: "0 16px 80px rgba(30, 215, 96, 0.18)"
      },
      keyframes: {
        'float-blob-1': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '50%': { transform: 'translate(6%, 10%) scale(1.06) rotate(180deg)' },
          '100%': { transform: 'translate(-3%, -3%) scale(0.94) rotate(360deg)' },
        },
        'float-blob-2': {
          '0%': { transform: 'translate(0, 0) scale(1.06) rotate(0deg)' },
          '50%': { transform: 'translate(-10%, -6%) scale(0.94) rotate(-180deg)' },
          '100%': { transform: 'translate(3%, 3%) scale(1) rotate(-360deg)' },
        },
        'pageIn': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'playing-bar': {
          '0%, 100%': { height: '5px' },
          '50%': { height: '16px' },
        }
      },
      animation: {
        'float-blob-1': 'float-blob-1 50s infinite alternate ease-in-out',
        'float-blob-2': 'float-blob-2 40s infinite alternate ease-in-out',
        'page-in': 'pageIn 200ms ease',
        'playing-bar': 'playing-bar 780ms ease-in-out infinite',
      }
    }
  },
  plugins: []
};
