import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import externalGlobals from "rollup-plugin-external-globals";
import viteAddCdnScript from "vite-add-cdn-script";

const externals = {
  react: "React",
  "react-dom": "ReactDOM",
};

export default defineConfig({
  base: "./",
  plugins: [react(), viteAddCdnScript({})],
  build: {
    rollupOptions: {
      external: [...Object.keys(externals)],
      plugins: [externalGlobals(externals)],
    },
  },
});
