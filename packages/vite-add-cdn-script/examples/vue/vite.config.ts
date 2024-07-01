import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import externalGlobals from "rollup-plugin-external-globals";
import viteAddCdnScript from "vite-add-cdn-script";

const externals = {
  vue: "Vue",
};

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue(), viteAddCdnScript({})],
  build: {
    rollupOptions: {
      external: [...Object.keys(externals)],
      plugins: [externalGlobals(externals)],
    },
  },
});
