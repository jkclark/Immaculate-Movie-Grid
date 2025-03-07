# Immaculate Movie Grid Frontend

For development, run `npm run dev` and `npx tailwindcss -i ./src/index.css -o ./src/output.css --watch` in two separate terminals. Vite running allows us to hot reload modules as we edit them. The Tailwind CSS program needs to run in order to keep your built CSS files as small as possible, only including what you actually use.

Github Actions will only deploy to S3, whence the static website is hosted, when there are changes to the `frontend/src` folder.

If you want to load the frontend on your phone (or any other LAN device for that matter), you can follow the steps outlined [here](https://stackoverflow.com/a/76934510/3801865).
The gist of it is:

- Make sure incoming connections allowed through firewall
- Add netsh rule
- Run Vite with `--host` flag

This project uses [shadcn](https://ui.shadcn.com/). The files related to it (which may not be obvious):

- `components.json`
- `src/components/ui/*`
- `src/lib/*`
- `src/index.css` is modified by the `shadcn` CLI
- `tailwind.config.js` is modified by the `shadcn` CLI

(Below is the original Vite + React-TS README)

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
