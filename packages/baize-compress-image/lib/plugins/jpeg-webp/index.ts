import type { CompressPlugin, CompressPluginConfig } from "../../types";

export { compress } from "./compress";

export function jpegWebp(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "jpeg-webp",
    matches: (fileType: string) => fileType === "image/jpeg" || fileType === "image/webp",
    moduleUrl: import.meta.url,
    defaultConfig: {
      quality: config?.quality ?? 0.75,
    },
  };
}
