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

// Green
const darkThemePalette = {
  eerie_black: {
    DEFAULT: "#181f1c",
    100: "#050606",
    200: "#0a0d0b",
    300: "#0f1311",
    400: "#141917",
    500: "#181f1c",
    600: "#40534b",
    700: "#678679",
    800: "#98b0a6",
    900: "#ccd8d2",
  },
  cal_poly_green: {
    DEFAULT: "#274029",
    100: "#080d08",
    200: "#101910",
    300: "#172618",
    400: "#1f3321",
    500: "#274029",
    600: "#467249",
    700: "#67a26c",
    800: "#9ac19d",
    900: "#cce0ce",
  },
  hunter_green: {
    DEFAULT: "#315c2b",
    100: "#0a1208",
    200: "#132411",
    300: "#1d3619",
    400: "#264822",
    500: "#315c2b",
    600: "#4b8d43",
    700: "#6fb765",
    800: "#9fcf98",
    900: "#cfe7cc",
  },
  fern_green: {
    DEFAULT: "#60712f",
    100: "#131609",
    200: "#262d13",
    300: "#39431c",
    400: "#4c5925",
    500: "#60712f",
    600: "#8aa143",
    700: "#abc16a",
    800: "#c7d59c",
    900: "#e3eacd",
  },
  apple_green: {
    DEFAULT: "#9ea93f",
    100: "#1f220c",
    200: "#3f4319",
    300: "#5e6525",
    400: "#7e8632",
    500: "#9ea93f",
    600: "#b8c25b",
    700: "#cad284",
    800: "#dce1ad",
    900: "#edf0d6",
  },
};

// Burger king
// const darkThemePalette = { licorice: { DEFAULT: "#220901", 100: "#070200", 200: "#0e0400", 300:
//   "#150601", 400: "#1c0801", 500: "#220901", 600: "#7f2304", 700: "#db3c07",
//   800: "#f97447", 900: "#fcb9a3", }, blood_red: { DEFAULT: "#621708", 100:
//   "#140502", 200: "#280903", 300: "#3b0e05", 400: "#4f1306", 500: "#621708",
//   600: "#ae290e", 700: "#ed421f", 800: "#f3816a", 900: "#f9c0b4", }, penn_red: {
//   DEFAULT: "#941b0c", 100: "#1d0602", 200: "#3a0b05", 300: "#581107", 400:
//   "#751609", 500: "#941b0c", 600: "#d32811", 700: "#ef513c", 800: "#f48b7d",
//   900: "#fac5be", }, rust: { DEFAULT: "#bc3908", 100: "#250b02", 200: "#4a1603",
//   300: "#702105", 400: "#952c06", 500: "#bc3908", 600: "#f54a0c", 700:
//   "#f77749", 800: "#faa586", 900: "#fcd2c2", }, "orange_(web)": { DEFAULT:
//   "#f6aa1c", 100: "#352302", 200: "#6a4604", 300: "#9f6907", 400: "#d48d09",
//   500: "#f6aa1c", 600: "#f7bb4b", 700: "#f9cc78", 800: "#fbdda5", 900:
//   "#fdeed2", }, };

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
