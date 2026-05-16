import { optimize } from "svgo/browser";
import type { CompressResult } from "../../types";

self.addEventListener("message", async (event) => {
  const { type, arrayBuffer, fileName, fileType, floatPrecision, svgoPlugins } = event.data;

  if (type === "compressImage") {
    try {
      const svgString = new TextDecoder().decode(arrayBuffer);
      const result = optimize(svgString, {
        floatPrecision: floatPrecision ?? 8,
        plugins: svgoPlugins ?? ["preset-default", "removeDimensions"],
      });
      const compressedData = new TextEncoder().encode(result.data);

      const originalSize = arrayBuffer.byteLength;
      if (compressedData.byteLength >= originalSize) {
        self.postMessage({ success: true, data: arrayBuffer, fileName, fileType } satisfies CompressResult);
        return;
      }

      self.postMessage({ success: true, data: compressedData.buffer, fileName, fileType } satisfies CompressResult);
    } catch (error) {
      self.postMessage({
        success: false,
        error: error instanceof Error ? error.message : "压缩失败",
      } satisfies CompressResult);
    }
  }
});
