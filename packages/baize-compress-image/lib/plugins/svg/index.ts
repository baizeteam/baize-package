import type { CompressPlugin, CompressPluginConfig } from "../../types";
import SvgWorker from "./worker.ts?worker&inline";

export interface SvgConfig extends CompressPluginConfig {
  floatPrecision?: number;
  svgoPlugins?: any[];
}

const DEFAULT_SVGO_PLUGINS = ["preset-default", "removeDimensions"];

export function svg(config?: SvgConfig): CompressPlugin {
  return {
    name: "svg",
    matches: (fileType: string) => fileType === "image/svg+xml",
    createWorker: () => new SvgWorker(),
    defaultConfig: {
      floatPrecision: config?.floatPrecision ?? 8,
      svgoPlugins: config?.svgoPlugins ?? DEFAULT_SVGO_PLUGINS,
    },
  };
}
