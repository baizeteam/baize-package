// main.ts
import { DEFAULT_QUALITY } from "./config.ts";
import { compressSingle } from "./utils.ts";

export const compressImageWorker = async (file: File, quality = DEFAULT_QUALITY): Promise<File> => {
  return await compressSingle(file, { quality, signal: undefined });
};

export const compressImagesWorker = async (files: File[], quality = DEFAULT_QUALITY): Promise<File[]> => {
  // TODO 使用worker pool，限制并发数
  return await Promise.all(files.map((file) => compressImageWorker(file, quality)));
};
