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
}

export interface CompressPlugin {
  name: string;
  matches: (fileType: string) => boolean;
  createWorker: () => Worker;
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
