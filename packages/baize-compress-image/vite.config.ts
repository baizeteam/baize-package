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
