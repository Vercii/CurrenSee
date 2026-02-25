/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}" // make sure all your source files are included
  ],
  theme: {
    extend: {
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 10px 0 rgba(16, 185, 129, 0.5)" },
          "50%": { boxShadow: "0 0 20px 5px rgba(16, 185, 129, 0.7)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2s infinite",
      },
    },
  },
  plugins: [],
}