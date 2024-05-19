import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteAddCdnScript from "./lib/main";

export default defineConfig({
  plugins: [react(), viteAddCdnScript({})],
  build: {
    lib: {
      entry: "./lib/main.ts",
      name: "index",
      fileName: "index",
    },
  },
});
