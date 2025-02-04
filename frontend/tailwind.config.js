/** @type {import('tailwindcss').Config} */

const lightThemePalette = {
  space_cadet: {
    DEFAULT: "#22223b",
    100: "#07070c",
    200: "#0d0d17",
    300: "#141423",
    400: "#1b1b2f",
    500: "#22223b",
    600: "#40406f",
    700: "#6060a3",
    800: "#9595c2",
    900: "#cacae0",
  },
  ultra_violet: {
    DEFAULT: "#4a4e69",
    100: "#0f1015",
    200: "#1e1f2a",
    300: "#2c2f3f",
    400: "#3b3e54",
    500: "#4a4e69",
    600: "#666b8f",
    700: "#8b8fac",
    800: "#b1b4c8",
    900: "#d8dae3",
  },
  rose_quartz: {
    DEFAULT: "#9a8c98",
    100: "#1f1c1f",
    200: "#3f383e",
    300: "#5e535c",
    400: "#7d6f7b",
    500: "#9a8c98",
    600: "#aea4ad",
    700: "#c3bbc1",
    800: "#d7d2d6",
    900: "#ebe8ea",
  },
  pale_dogwood: {
    DEFAULT: "#c9ada7",
    100: "#2e1f1c",
    200: "#5b3e38",
    300: "#895d54",
    400: "#ad8279",
    500: "#c9ada7",
    600: "#d4bdb8",
    700: "#dececa",
    800: "#e9dedc",
    900: "#f4efed",
  },
  isabelline: {
    DEFAULT: "#f2e9e4",
    100: "#3f2a1e",
    200: "#7f543d",
    300: "#b58165",
    400: "#d3b5a4",
    500: "#f2e9e4",
    600: "#f4ede9",
    700: "#f7f1ee",
    800: "#faf6f4",
    900: "#fcfaf9",
  },
  josh_black: {
    DEFAULT: "#000",
  },
};

const darkThemePalette = {
  timberwolf: {
    DEFAULT: "#dad7cd",
    100: "#312e24",
    200: "#615b48",
    300: "#92896c",
    400: "#b6b09c",
    500: "#dad7cd",
    600: "#e2dfd7",
    700: "#e9e7e1",
    800: "#f0efeb",
    900: "#f8f7f5",
  },
  sage: {
    DEFAULT: "#a3b18a",
    100: "#212619",
    200: "#434c33",
    300: "#64724c",
    400: "#859865",
    500: "#a3b18a",
    600: "#b6c1a2",
    700: "#c8d0b9",
    800: "#dae0d0",
    900: "#edefe8",
  },
  fern_green: {
    DEFAULT: "#588157",
    100: "#111911",
    200: "#233323",
    300: "#344c34",
    400: "#466645",
    500: "#588157",
    600: "#739f72",
    700: "#96b795",
    800: "#b9cfb9",
    900: "#dce7dc",
  },
  hunter_green: {
    DEFAULT: "#3a5a40",
    100: "#0c120d",
    200: "#172419",
    300: "#233626",
    400: "#2e4833",
    500: "#3a5a40",
    600: "#56865f",
    700: "#7aaa83",
    800: "#a7c7ac",
    900: "#d3e3d6",
  },
  brunswick_green: {
    DEFAULT: "#344e41",
    100: "#0a0f0d",
    200: "#141f1a",
    300: "#1f2e26",
    400: "#293d33",
    500: "#344e41",
    600: "#527a66",
    700: "#75a38c",
    800: "#a3c2b3",
    900: "#d1e0d9",
  },
  josh_white: {
    DEFAULT: "#FFF",
  },
};

const semanticColors = {
  // Light theme
  "theme-light-primary": lightThemePalette.space_cadet,
  "theme-light-secondary": lightThemePalette.ultra_violet,
  "theme-light-accent": lightThemePalette.rose_quartz,
  "theme-light-other-1": lightThemePalette.pale_dogwood,
  "theme-light-other-2": lightThemePalette.isabelline,
  "theme-light-text": lightThemePalette.josh_black,

  // Dark theme
  "theme-dark-primary": darkThemePalette.brunswick_green,
  "theme-dark-secondary": darkThemePalette.fern_green,
  "theme-dark-accent": darkThemePalette.timberwolf,
  "theme-dark-other-1": darkThemePalette.sage,
  "theme-dark-other-2": darkThemePalette.hunter_green,
  "theme-dark-text": darkThemePalette.josh_white,
};

export default {
  darkMode: "class",
  content: ["index.html", "src/**/*.{vue,js,ts,jsx,tsx}"],
  safelist: [
    "text-xl",
    "text-2xl",
    "text-3xl",
    "text-4xl",
    "text-5xl",
    "text-6xl",
    "text-7xl",
    "sm:text-xl",
    "sm:text-2xl",
    "sm:text-3xl",
    "sm:text-4xl",
    "sm:text-5xl",
    "sm:text-6xl",
    "sm:text-7xl",
    "grid-rows-3", // for showing grids in the summary that are 3x3
    "grid-cols-3",
    "grid-rows-4", // for the actual game grid
    "grid-cols-4",
  ],
  theme: {
    extend: {
      spacing: {
        "2vh": "2vh",
        30: "7.5rem",
      },
      colors: semanticColors,
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".bg-theme-primary": {
          "@apply bg-theme-light-primary dark:bg-theme-dark-primary": {},
        },
        ".bg-theme-secondary": {
          "@apply bg-theme-light-secondary dark:bg-theme-dark-secondary": {},
        },
        ".bg-theme-accent": {
          "@apply bg-theme-light-accent dark:bg-theme-dark-accent": {},
        },
        ".bg-theme-other-1": {
          "@apply bg-theme-light-other-1 dark:bg-theme-dark-other-1": {},
        },
        ".bg-theme-other-2": {
          "@apply bg-theme-light-other-2 dark:bg-theme-dark-other-2": {},
        },
        ".theme-text": {
          "@apply text-theme-light-text dark:text-theme-dark-text": {},
        },
      });
    },
  ],
};
