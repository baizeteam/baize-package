import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodeExternals from "rollup-plugin-node-externals";

const pageConfig = {
  server: {
    port: 6103,
  },
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist-page",
  },
};

const libConfig = {
  // [How to bundle a worker in library mode? · vitejs/vite · Discussion #15547](https://github.com/vitejs/vite/discussions/15547)
  base: "./",
  build: {
    lib: {
      entry: "./lib/main.ts",
      name: "index",
      fileName: "index",
    },
    rollupOptions: {
      plugins: [nodeExternals()],
      extends: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  },
};

export default defineConfig(process.env.BUILD_MODE === "lib" ? libConfig : pageConfig);
