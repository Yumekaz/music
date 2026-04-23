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
      }
    }
  },
  plugins: []
};
