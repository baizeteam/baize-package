import type { CompressPlugin, CompressPluginConfig } from "../../types";
import moduleUrl from "./compress.ts?worker&url";

export interface SvgConfig extends CompressPluginConfig {
  floatPrecision?: number;
  svgoPlugins?: any[];
}

const DEFAULT_SVGO_PLUGINS = ["preset-default", "removeDimensions"];

export function svg(config?: SvgConfig): CompressPlugin {
  return {
    name: "svg",
    matches: (fileType: string) => fileType === "image/svg+xml",
    moduleUrl,
    defaultConfig: {
      floatPrecision: config?.floatPrecision ?? 8,
      svgoPlugins: config?.svgoPlugins ?? DEFAULT_SVGO_PLUGINS,
    },
  };
}
