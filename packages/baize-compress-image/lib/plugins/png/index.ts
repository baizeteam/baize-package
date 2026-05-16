import type { CompressPlugin, CompressPluginConfig } from "../../types";
import PngWorker from "./worker.ts?worker&inline";

export function png(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "png",
    matches: (fileType: string) => fileType === "image/png",
    createWorker: () => new PngWorker(),
    defaultConfig: {
      quality: config?.quality ?? 0.8,
    },
  };
}
