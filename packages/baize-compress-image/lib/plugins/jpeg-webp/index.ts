import type { CompressPlugin, CompressPluginConfig } from "../../types";
import { compress } from "./compress";

export function jpegWebp(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "jpeg-webp",
    matches: (fileType: string) => fileType === "image/jpeg" || fileType === "image/webp",
    func: compress,
    moduleUrl: import.meta.url,
    defaultConfig: {
      quality: config?.quality ?? 0.75,
    },
  };
}
