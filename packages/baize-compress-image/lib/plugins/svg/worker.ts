import { optimize } from "svgo/browser";
import type { CompressResult, CompressParams } from "../../types";

self.addEventListener("message", async (event) => {
  const { type, arrayBuffer, fileName, fileType, quality } = event.data;

  if (type === "compressImage") {
    try {
      const params: CompressParams = { arrayBuffer, fileName, fileType, quality };
      const svgString = new TextDecoder().decode(params.arrayBuffer);
      const floatPrecision = Math.max(1, Math.round(params.quality * 10));
      const result = optimize(svgString, {
        floatPrecision,
        plugins: [
          "preset-default",
          "removeDimensions",
        ],
      });
      const compressedData = new TextEncoder().encode(result.data);

      const originalSize = params.arrayBuffer.byteLength;
      if (compressedData.byteLength >= originalSize) {
        self.postMessage({ success: true, data: params.arrayBuffer, fileName: params.fileName, fileType: params.fileType } satisfies CompressResult);
        return;
      }

      self.postMessage({ success: true, data: compressedData.buffer, fileName: params.fileName, fileType: params.fileType } satisfies CompressResult);
    } catch (error) {
      self.postMessage({
        success: false,
        error: error instanceof Error ? error.message : "压缩失败",
      } satisfies CompressResult);
    }
  }
});
