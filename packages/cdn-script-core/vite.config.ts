import { defineConfig } from "vite";
import nodeExternals from "rollup-plugin-node-externals";
import dts from "vite-plugin-dts";
import { resolve } from "path";

const libConfig = {
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "index",

      fileName: "my-lib",
    },
    rollupOptions: {
      plugins: [nodeExternals()],
    },
  },
  plugins: [dts()],
};

export default defineConfig(libConfig);
