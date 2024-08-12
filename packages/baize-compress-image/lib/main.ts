// main.ts
import { DEFAULT_QUALITY } from "./config.ts";
import { compressSingle } from "./utils.ts";

export const compressImageWorker = async (file: File, quality = DEFAULT_QUALITY): Promise<File> => {
  return await compressSingle(file, { quality, signal: undefined });
};
