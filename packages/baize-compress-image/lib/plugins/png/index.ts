import type { CompressPlugin, CompressPluginConfig } from "../../types";
import moduleUrl from "./compress.ts?worker&url";

export function png(config?: CompressPluginConfig): CompressPlugin {
  return {
    name: "png",
    matches: (fileType: string) => fileType === "image/png",
    moduleUrl,
    defaultConfig: {
      quality: config?.quality ?? 0.8,
    },
  };
}
