/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        mont: ["Montserrat","sans-serif"]
      },
      colors:{
        primary: "#34225A",
        fill : "#FF4B41"
      }
    },
  },
  plugins: [],
}