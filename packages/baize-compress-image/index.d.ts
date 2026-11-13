export interface CompressBackInfo {
  compressInfo: {
    rate: number;
    time: number;
    originalSize: number;
    compressedSize: number;
  };
  file: File;
}

export interface CompressPluginConfig {
  quality?: number;
  floatPrecision?: number;
  svgoPlugins?: any[];
  /** gif：gifsicle -O 等级，1 | 2 | 3 */
  optimize?: 1 | 2 | 3;
  /** gif：gifsicle --lossy，0-200。设置后不再按 quality 换算 */
  lossy?: number;
  /** 覆盖 worker 加载压缩模块的地址。不传则使用插件自带的地址 */
  moduleUrl?: string;
  /** 自定义插件可附带自己的参数，会原样发给 worker */
  [key: string]: any;
}

export interface CompressPayload {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  [key: string]: any;
}

export interface CompressResult {
  success: boolean;
  data?: ArrayBuffer;
  fileName?: string;
  fileType?: string;
  error?: string;
}

export type CompressFunc = (payload: CompressPayload) => Promise<CompressResult>;

export interface CompressPlugin {
  name: string;
  matches: (fileType: string) => boolean;
  /** 压缩函数，放在本模块里即可，文件名不限 */
  func: CompressFunc;
  /** 压缩模块地址。Vite 可用 import.meta.url；Next/Webpack 需要 new URL("./文件.js", import.meta.url).href */
  moduleUrl: string;
  defaultConfig: CompressPluginConfig;
}

export interface ImageCompressorOptions {
  workerNum?: number;
  plugins: CompressPlugin[];
}

export class ImageCompressor {
  constructor(params: ImageCompressorOptions);
  compressImagesWorker(files: File[]): Promise<PromiseSettledResult<CompressBackInfo>[]>;
  cancelAll(): void;
}
