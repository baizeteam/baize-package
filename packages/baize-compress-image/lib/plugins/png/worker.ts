import UPNG from "upng-js";
import type { CompressResult, CompressParams } from "../../types";

self.addEventListener("message", async (event) => {
  const { type, arrayBuffer, fileName, fileType, quality } = event.data;

  if (type === "compressImage") {
    try {
      const params: CompressParams = { arrayBuffer, fileName, fileType, quality };
      const decoded = UPNG.decode(params.arrayBuffer);
      const rgba8 = UPNG.toRGBA8(decoded);
      const compressedData = UPNG.encode(rgba8, decoded.width, decoded.height, 256 * params.quality);

      const originalSize = params.arrayBuffer.byteLength;
      if (compressedData.byteLength >= originalSize) {
        self.postMessage({ success: true, data: params.arrayBuffer, fileName: params.fileName, fileType: params.fileType } satisfies CompressResult);
        return;
      }

      self.postMessage({ success: true, data: compressedData, fileName: params.fileName, fileType: params.fileType } satisfies CompressResult);
    } catch (error) {
      self.postMessage({
        success: false,
        error: error instanceof Error ? error.message : "压缩失败",
      } satisfies CompressResult);
    }
  }
});
