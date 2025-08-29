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

export function compressImagesWorker(
  files: File[],
  options?: CompressOptions,
): Promise<PromiseSettledResult<CompressBackInfo>[]>;
export function cancelAllCompressWorker(): void;

export class ImageCompressor {
  private constructor(workerNum?: number);
  compressImagesWorker(files: File[], options?: CompressOptions): Promise<PromiseSettledResult<CompressBackInfo>[]>;
  cancelAll(): void;
}
