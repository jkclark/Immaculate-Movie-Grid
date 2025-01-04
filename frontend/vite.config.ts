import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      common: path.resolve(__dirname, "../common/"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
