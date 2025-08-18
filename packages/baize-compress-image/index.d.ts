export interface CompressBackInfo {
  compressInfo: {
    rate: number;
    time: number;
  };
  file: File;
}

export function compressImagesWorker(
  files: File[],
  quality?: number,
): Promise<PromiseSettledResult<CompressBackInfo>[]>;
export function cancelAllCompressWorker(): void;
