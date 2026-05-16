import type { CompressPlugin, CompressPluginConfig } from "../../types";
import JpegWebpWorker from "./worker.ts?worker&inline";

export function jpegWebp(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "jpeg-webp",
    matches: (fileType: string) => fileType === "image/jpeg" || fileType === "image/webp",
    createWorker: () => new JpegWebpWorker(),
    defaultConfig: {
      quality: config?.quality ?? 0.75,
    },
  };
}
