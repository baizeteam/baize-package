import type { CompressPlugin } from "../../types";
import SvgWorker from "./worker.ts?worker&inline";

export const svgPlugin: CompressPlugin = {
  name: "svg",
  matches: (fileType: string) => fileType === "image/svg+xml",
  createWorker: () => new SvgWorker(),
};
