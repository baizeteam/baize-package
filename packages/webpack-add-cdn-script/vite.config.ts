import { defineConfig } from "vite";
import nodeExternals from "rollup-plugin-node-externals";

const libConfig = {
  build: {
    lib: {
      entry: "./lib/index.ts",
      name: "index",
      fileName: "index",
    },
    rollupOptions: {
      plugins: [nodeExternals()],
    },
  },
};

export default defineConfig(libConfig);
