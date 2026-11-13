import type { CompressPlugin, CompressPluginConfig } from "../index";

export interface SvgConfig extends CompressPluginConfig {
  floatPrecision?: number;
  svgoPlugins?: any[];
}

export declare function svg(config?: SvgConfig): CompressPlugin;
