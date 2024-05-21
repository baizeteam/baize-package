import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodeExternals from "rollup-plugin-node-externals";

export default defineConfig({
  plugins: [react(), nodeExternals()],
  build: {
    lib: {
      entry: "./lib/main.ts",
      name: "index",
      fileName: "index",
    },
  },
});
