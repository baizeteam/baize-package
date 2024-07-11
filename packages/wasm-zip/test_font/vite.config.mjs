import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import { createHtmlPlugin } from "vite-plugin-html";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 6102,
  },
  plugins: [wasm()],

  build: {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "index",
      fileName: "index",
    },
  },
  optimizeDeps: {
    exclude: ["wasm-zip"],
  },
});
