import type { CompressPlugin, CompressPluginConfig } from "../../types";

export { compress } from "./compress";

export function png(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "png",
    matches: (fileType: string) => fileType === "image/png",
    moduleUrl: import.meta.url,
    defaultConfig: {
      quality: config?.quality ?? 0.8,
    },
  };
}
