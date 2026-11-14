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
  /** @deprecated 压缩函数由 Worker 从模块入口加载，无需在插件对象中提供 */
  func?: CompressFunc;
  /** 插件内部的压缩模块入口，模块导出 compress；内置插件的使用者无需配置 */
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
