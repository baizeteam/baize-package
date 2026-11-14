import type { CompressPlugin, CompressPluginConfig } from "../../types";
import moduleUrl from "./compress.ts?worker&url";

export function jpegWebp(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "jpeg-webp",
    matches: (fileType: string) => fileType === "image/jpeg" || fileType === "image/webp",
    moduleUrl,
    defaultConfig: {
      quality: config?.quality ?? 0.75,
    },
  };
}
