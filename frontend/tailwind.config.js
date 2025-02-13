/** @type {import('tailwindcss').Config} */
const lightThemePalette = {
  ucla_blue: {
    DEFAULT: "#4d7298",
    100: "#0f171f",
    200: "#1f2e3d",
    300: "#2e455c",
    400: "#3e5c7a",
    500: "#4d7298",
    600: "#6a8fb4",
    700: "#8fabc7",
    800: "#b4c7d9",
    900: "#dae3ec",
  },
  air_superiority_blue: {
    DEFAULT: "#77a6b6",
    100: "#152327",
    200: "#2a454e",
    300: "#3f6875",
    400: "#548a9c",
    500: "#77a6b6",
    600: "#92b8c4",
    700: "#adcad3",
    800: "#c9dbe2",
    900: "#e4edf0",
  },
  light_blue: {
    DEFAULT: "#9dc3c2",
    100: "#1b2c2b",
    200: "#355756",
    300: "#508381",
    400: "#71a8a6",
    500: "#9dc3c2",
    600: "#b1cfce",
    700: "#c4dbda",
    800: "#d8e7e6",
    900: "#ebf3f3",
  },
  tea_green: {
    DEFAULT: "#d0efb1",
    100: "#2a450e",
    200: "#548b1c",
    300: "#7dd02b",
    400: "#a7e16d",
    500: "#d0efb1",
    600: "#daf3c2",
    700: "#e3f6d1",
    800: "#edf9e1",
    900: "#f6fcf0",
  },
  celadon: {
    DEFAULT: "#b3d89c",
    100: "#213515",
    200: "#436a2a",
    300: "#64a040",
    400: "#8ac367",
    500: "#b3d89c",
    600: "#c2e0b0",
    700: "#d2e7c4",
    800: "#e1efd8",
    900: "#f0f7eb",
  },
};

const darkThemePalette = {
  rich_black: {
    DEFAULT: "#00171f",
    100: "#000506",
    200: "#00090c",
    300: "#000e12",
    400: "#001218",
    500: "#00171f",
    600: "#005f7e",
    700: "#00a7de",
    800: "#3fcfff",
    900: "#9fe7ff",
  },
  ucla_blue: {
    DEFAULT: "#4d7298",
    100: "#0f171f",
    200: "#1f2e3d",
    300: "#2e455c",
    400: "#3e5c7a",
    500: "#4d7298",
    600: "#6a8fb4",
    700: "#8fabc7",
    800: "#b4c7d9",
    900: "#dae3ec",
  },
  air_superiority_blue: {
    DEFAULT: "#77a6b6",
    100: "#152327",
    200: "#2a454e",
    300: "#3f6875",
    400: "#548a9c",
    500: "#77a6b6",
    600: "#92b8c4",
    700: "#adcad3",
    800: "#c9dbe2",
    900: "#e4edf0",
  },
  rose_quartz: {
    DEFAULT: "#bb9bb0",
    100: "#291c24",
    200: "#513748",
    300: "#7a536c",
    400: "#9f728f",
    500: "#bb9bb0",
    600: "#c8afc0",
    700: "#d6c3cf",
    800: "#e4d7df",
    900: "#f1ebef",
  },
  lavender_blush: {
    DEFAULT: "#f1e3e4",
    100: "#3e1f22",
    200: "#7d3f43",
    300: "#b2676c",
    400: "#d2a5a8",
    500: "#f1e3e4",
    600: "#f4e9ea",
    700: "#f7efef",
    800: "#faf4f5",
    900: "#fcfafa",
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
semanticColors["theme-light-text"] = { DEFAULT: "#fff" };
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
    "grid-rows-3", // for showing grids in the summary that are 3x3
    "grid-cols-3",
    "grid-rows-4", // for the actual game grid
    "grid-cols-4",
    "rounded-xl",
    "rounded-tl-xl",
    "rounded-tr-xl",
    "rounded-bl-xl",
    "rounded-br-xl",
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
