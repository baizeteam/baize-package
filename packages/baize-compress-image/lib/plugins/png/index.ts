import type { CompressPlugin } from "../../types";
import PngWorker from "./worker.ts?worker&inline";

export const pngPlugin: CompressPlugin = {
  name: "png",
  matches: (fileType: string) => fileType === "image/png",
  createWorker: () => new PngWorker(),
};
