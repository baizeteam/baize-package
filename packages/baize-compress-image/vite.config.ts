import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";

const pageConfig: UserConfig = {
  server: {
    port: 6103,
  },
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist-page",
  },
  optimizeDeps: {
    include: ["upng-js", "svgo", "gifsicle-wasm-browser"],
  },
};

const libConfig: UserConfig = {
  base: "./",
  build: {
    lib: {
      entry: {
        index: "./lib/main.ts",
        "plugins/jpeg-webp": "./lib/plugins/jpeg-webp/index.ts",
        "plugins/png": "./lib/plugins/png/index.ts",
        "plugins/svg": "./lib/plugins/svg/index.ts",
        "plugins/gif": "./lib/plugins/gif/index.ts",
      },
      formats: ["es"],
    },
  },
};

export default defineConfig(process.env.BUILD_MODE === "lib" ? libConfig : pageConfig);
