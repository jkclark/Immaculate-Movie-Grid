/** @type {import('tailwindcss').Config} */
export default {
  content: ["index.html", "src/**/*.{vue,js,ts,jsx,tsx}"],
  safelist: ["text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"],
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
