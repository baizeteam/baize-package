import type { CompressPlugin, CompressPluginConfig } from "../../types";
import moduleUrl from "./compress.ts?worker&url";

export interface GifConfig extends CompressPluginConfig {
  optimize?: 1 | 2 | 3;
  lossy?: number;
}

export function gif(config?: GifConfig): CompressPlugin {
  return {
    name: "gif",
    matches: (fileType: string) => fileType === "image/gif",
    moduleUrl,
    defaultConfig: {
      quality: config?.quality ?? 0.75,
      optimize: config?.optimize ?? 1,
      ...(config?.lossy !== undefined ? { lossy: config.lossy } : {}),
    },
  };
}
