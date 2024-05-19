import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteReactStyleName from "./lib/main";
import genericNames from "generic-names";
import { resolve } from "path";

const generateScopedName = genericNames("[name]__[local]__[hash:base64:4]");

export default defineConfig({
  plugins: [
    react(),
    viteReactStyleName({
      generateScopedName,
      filetypes: {
        ".less": {
          syntax: "postcss-less",
        },
      },
    }),
  ],
  css: {
    modules: {
      generateScopedName: generateScopedName,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      external: ["@babel/core", "babel-plugin-react-css-modules", "babel-plugin-module-resolver"],
    },
    lib: {
      entry: "./lib/main.ts",
      name: "index",
      fileName: "index",
    },
  },
});
