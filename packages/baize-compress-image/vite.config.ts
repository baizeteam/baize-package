import { posix } from "node:path";
import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

// 通过 ?worker&url 将压缩模块打包成独立 ESM，保留 compress 导出供通用 Worker 加载。
const worker: UserConfig["worker"] = {
  format: "es",
  rollupOptions: {
    output: {
      entryFileNames(chunk) {
        const plugin = chunk.facadeModuleId?.replaceAll("\\", "/").match(/\/plugins\/([^/]+)\/compress\.ts$/)?.[1];
        // 保留原包公开的 plugins/*-compress.js 子路径。
        return plugin ? `plugins/${plugin}-compress.js` : "assets/[name]-[hash].js";
      },
    },
  },
  plugins: () => [
    {
      name: "baize-compression-module-exports",
      options(options) {
        return { ...options, preserveEntrySignatures: "strict" };
      },
    },
  ],
};

const pageConfig: UserConfig = {
  worker,
  server: { port: 6103 },
  plugins: [react()],
  base: "./",
  build: { outDir: "dist-page" },
  optimizeDeps: {
    include: ["upng-js", "svgo", "gifsicle-wasm-browser"],
  },
};

const libConfig: UserConfig = {
  worker,
  base: "./",
  experimental: {
    renderBuiltUrl(filename, { hostId, hostType }) {
      if (hostType === "js" && filename.includes("pool.worker-")) {
        // 通用 Worker 需要保留站点 origin，避免消费端将小文件内联为 data URL。
        const relative = posix.relative(posix.dirname(hostId), filename);
        return { runtime: `new URL(${JSON.stringify(`./${relative}?no-inline`)}, import.meta.url).href` };
      }
      return { relative: true };
    },
  },
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
