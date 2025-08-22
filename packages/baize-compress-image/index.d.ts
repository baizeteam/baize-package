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
  workerNum?: number;
}

export function compressImagesWorker(
  files: File[],
  options?: CompressOptions,
): Promise<PromiseSettledResult<CompressBackInfo>[]>;
export function cancelAllCompressWorker(): void;
