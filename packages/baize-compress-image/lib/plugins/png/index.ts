import type { CompressPlugin, CompressPluginConfig } from "../../types";
import { compress } from "./compress";

export function png(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "png",
    matches: (fileType: string) => fileType === "image/png",
    func: compress,
    moduleUrl: import.meta.url,
    defaultConfig: {
      quality: config?.quality ?? 0.8,
    },
  };
}
