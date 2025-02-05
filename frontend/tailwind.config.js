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
};

const darkThemePalette = {
  gunmetal: {
    DEFAULT: "#16262e",
    100: "#040709",
    200: "#090f12",
    300: "#0d161b",
    400: "#111e24",
    500: "#16262e",
    600: "#325769",
    700: "#4f88a5",
    800: "#87b1c5",
    900: "#c3d8e2",
  },
  charcoal: {
    DEFAULT: "#2e4756",
    100: "#090e11",
    200: "#131c22",
    300: "#1c2b34",
    400: "#253945",
    500: "#2e4756",
    600: "#496f87",
    700: "#6c96b0",
    800: "#9db9ca",
    900: "#cedce5",
  },
  cerulean: {
    DEFAULT: "#3c7a89",
    100: "#0c191c",
    200: "#183137",
    300: "#244a53",
    400: "#31626f",
    500: "#3c7a89",
    600: "#52a0b3",
    700: "#7db8c6",
    800: "#a9cfd9",
    900: "#d4e7ec",
  },
  cool_gray: {
    DEFAULT: "#9fa2b2",
    100: "#1e1f25",
    200: "#3c3e4b",
    300: "#5a5d70",
    400: "#797d94",
    500: "#9fa2b2",
    600: "#b2b4c1",
    700: "#c5c7d1",
    800: "#d9dae0",
    900: "#ececf0",
  },
  thistle: {
    DEFAULT: "#dbc2cf",
    100: "#341f2a",
    200: "#683d53",
    300: "#9c5c7d",
    400: "#bd8ea6",
    500: "#dbc2cf",
    600: "#e2ced9",
    700: "#e9dae2",
    800: "#f1e7ec",
    900: "#f8f3f5",
  },
};

/**
 * Here we map the color palettes above to semantic color names. For example,
 * the first color in the lightThemePalette object will get mapped to the
 * theme-light-primary semantic color name because "primary" is the first color
 * name in the themeColorNames array.
 */
const semanticColors = {};
const themeColorNames = [
  "primary",
  "secondary",
  "accent",
  "other-1",
  "other-2",
  // "text",
];

// Add the light colors in order
let index = 0;
for (const value of Object.values(lightThemePalette)) {
  semanticColors[`theme-light-${themeColorNames[index]}`] = value;
  index += 1;
}

index = 0;
// Add the dark colors in order
for (const value of Object.values(darkThemePalette)) {
  // Add the dark theme color to the semantic colors
  semanticColors[`theme-dark-${themeColorNames[index]}`] = value;
  index += 1;
}

// Manually add the text colors for now
semanticColors["theme-light-text"] = { DEFAULT: "#000" };
semanticColors["theme-dark-text"] = { DEFAULT: "#fff" };

// semanticColors looks like this:
// const semanticColors = {
//   "theme-light-primary": lightThemePalette.space_cadet,
//   "theme-light-secondary": lightThemePalette...,
//   "theme-light-accent": lightThemePalette...,
//   "theme-light-other-1": lightThemePalette...,
//   "theme-light-other-2": lightThemePalette...,
//
//   "theme-dark-primary": darkThemePalette.gunmetal,
//   "theme-dark-secondary": darkThemePalette...,
//   "theme-dark-accent": darkThemePalette...,
//   "theme-dark-other-1": darkThemePalette...,
//   "theme-dark-other-2": darkThemePalette...,
//
//   "theme-light-text": { DEFAULT: "#000" },
//   "theme-dark-text": { DEFAULT: "#fff" },
// };

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
