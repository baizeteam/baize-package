import { defineConfig, type Plugin, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

const pluginCompressOutput: Record<string, string> = {
  "/lib/plugins/gif/index.ts": "gif-compress.js",
  "/lib/plugins/png/index.ts": "png-compress.js",
  "/lib/plugins/svg/index.ts": "svg-compress.js",
  "/lib/plugins/jpeg-webp/index.ts": "jpeg-webp-compress.js",
};

function rewritePluginModuleUrl(): Plugin {
  return {
    name: "baize-rewrite-module-url",
    apply: "build",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.split("?")[0].replaceAll("\\", "/");
      const outputName = Object.entries(pluginCompressOutput).find(([suffix]) => normalized.endsWith(suffix))?.[1];
      if (!outputName) return null;
      const moduleUrlExpr = "config?.moduleUrl ?? import.meta.url";
      if (!code.includes(moduleUrlExpr)) {
        this.error(`${normalized} 缺少 ${moduleUrlExpr}`);
      }
      const next = code
        .replace(/import\s+\{\s*compress\s*\}\s+from\s+["']\.\/compress["'];?\r?\n/, "")
        .replace(
          "func: compress,",
          'func: async () => {\n      throw new Error("压缩函数由 worker 加载");\n    },',
        )
        .replace(
          moduleUrlExpr,
          `config?.moduleUrl ?? new URL("./${outputName}", import.meta.url).href`,
        );
      if (next.includes('from "./compress"') || next.includes(moduleUrlExpr)) {
        this.error(`${normalized} 的 moduleUrl 改写不完整`);
      }
      return { code: next, map: null };
    },
  };
}

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
  plugins: [rewritePluginModuleUrl()],
  build: {
    lib: {
      entry: {
        index: "./lib/main.ts",
        "plugins/jpeg-webp": "./lib/plugins/jpeg-webp/index.ts",
        "plugins/png": "./lib/plugins/png/index.ts",
        "plugins/svg": "./lib/plugins/svg/index.ts",
        "plugins/gif": "./lib/plugins/gif/index.ts",
        "plugins/jpeg-webp-compress": "./lib/plugins/jpeg-webp/compress.ts",
        "plugins/png-compress": "./lib/plugins/png/compress.ts",
        "plugins/svg-compress": "./lib/plugins/svg/compress.ts",
        "plugins/gif-compress": "./lib/plugins/gif/compress.ts",
      },
      formats: ["es"],
    },
  },
};

export default defineConfig(process.env.BUILD_MODE === "lib" ? libConfig : pageConfig);
