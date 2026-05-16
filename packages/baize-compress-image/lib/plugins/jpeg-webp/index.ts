import type { CompressPlugin } from "../../types";
import JpegWebpWorker from "./worker.ts?worker&inline";

export const jpegWebpPlugin: CompressPlugin = {
  name: "jpeg-webp",
  matches: (fileType: string) => fileType === "image/jpeg" || fileType === "image/webp",
  createWorker: () => new JpegWebpWorker(),
};
