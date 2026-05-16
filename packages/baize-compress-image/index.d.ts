export interface CompressBackInfo {
  compressInfo: {
    rate: number;
    time: number;
    originalSize: number;
    compressedSize: number;
  };
  file: File;
}

export interface CompressOptions {
  quality?: number;
}

export interface CompressPlugin {
  name: string;
  matches: (fileType: string) => boolean;
  createWorker: () => Worker;
}

export interface ImageCompressorOptions {
  workerNum?: number;
  plugins?: CompressPlugin[];
}

export class ImageCompressor {
  constructor(params?: ImageCompressorOptions);
  compressImagesWorker(files: File[], options?: CompressOptions): Promise<PromiseSettledResult<CompressBackInfo>[]>;
  cancelAll(): void;
}

export declare const jpegWebpPlugin: CompressPlugin;
export declare const pngPlugin: CompressPlugin;
export declare const svgPlugin: CompressPlugin;
export declare const defaultPlugins: CompressPlugin[];
