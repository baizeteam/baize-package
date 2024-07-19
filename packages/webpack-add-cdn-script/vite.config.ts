import { defineConfig } from "vite";
import nodeExternals from "rollup-plugin-node-externals";
import dts from "vite-plugin-dts";

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
  plugins: [dts({})],
};

export default defineConfig(libConfig);
