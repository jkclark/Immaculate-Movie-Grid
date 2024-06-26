/** @type {import('tailwindcss').Config} */
export default {
  content: ["index.html", "src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      spacing: {
        "2vh": "2vh",
        30: "7.5rem",
      },
    },
  },
  plugins: [],
};
