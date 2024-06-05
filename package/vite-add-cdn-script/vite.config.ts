import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodeExternals from "rollup-plugin-node-externals";
import externalGlobals from "rollup-plugin-external-globals";

import viteAddCdnScript from "./lib/main";
const externals = {
  react: "React",
  "react-dom": "ReactDOM",
  "@remix-run/router": "@remix-run/router",
  "react-router": "react-router",
  "react-router-dom": "ReactRouterDOM",
};
export default defineConfig({
  plugins: [react(), viteAddCdnScript({})],
  build: {
    // lib: {
    //   entry: "./lib/main.ts",
    //   name: "index",
    //   fileName: "index",
    // },
    rollupOptions: {
      external: [...Object.keys(externals)],
      plugins: [externalGlobals(externals)],
    },
  },
});
