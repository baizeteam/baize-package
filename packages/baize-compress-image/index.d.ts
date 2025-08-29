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

export class ImageCompressor {
  private constructor(params: { workerNum?: number });
  compressImagesWorker(files: File[], options?: CompressOptions): Promise<PromiseSettledResult<CompressBackInfo>[]>;
  cancelAll(): void;
}
