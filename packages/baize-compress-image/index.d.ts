export function compressImageWorker(file: File, quality?: number): Promise<File>;
export function compressImagesWorker(files: File[], quality?: number): Promise<PromiseSettledResult<File>[]>;
export function cancelAllCompressWorker(): void;
