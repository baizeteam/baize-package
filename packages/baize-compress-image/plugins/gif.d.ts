import type { CompressPlugin, CompressPluginConfig } from "../index";

export interface GifConfig extends CompressPluginConfig {
  optimize?: 1 | 2 | 3;
  lossy?: number;
}

export declare function gif(config?: GifConfig): CompressPlugin;
