import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteReactStyleName from "./lib/main";
import genericNames from "generic-names";
import { resolve } from "path";

const generateScopedName = genericNames("[name]__[local]__[hash:base64:4]");

const alias = {
  "@": resolve(__dirname, "src"),
};

const proConfig: UserConfig = {
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
};

const devConfig: UserConfig = {
  plugins: [
    react(),
    viteReactStyleName({
      generateScopedName,
      filetypes: {
        ".less": {
          syntax: "postcss-less",
        },
      },
      alias,
    }),
  ],
  css: {
    modules: {
      generateScopedName: generateScopedName,
    },
  },
  resolve: {
    alias,
  },
};

console.log(process.env.NODE_ENV === "production");

export default defineConfig(process.env.NODE_ENV === "production" ? proConfig : devConfig);
