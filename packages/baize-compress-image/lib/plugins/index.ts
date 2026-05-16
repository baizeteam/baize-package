export { jpegWebpPlugin } from "./jpeg-webp";
export { pngPlugin } from "./png";
export { svgPlugin } from "./svg";

import { jpegWebpPlugin } from "./jpeg-webp";
import { pngPlugin } from "./png";
import { svgPlugin } from "./svg";
import type { CompressPlugin } from "../types";

export const defaultPlugins: CompressPlugin[] = [jpegWebpPlugin, pngPlugin, svgPlugin];
