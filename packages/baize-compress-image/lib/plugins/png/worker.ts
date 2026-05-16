import UPNG from "upng-js";
import type { CompressResult } from "../../types";

self.addEventListener("message", async (event) => {
  const { type, arrayBuffer, fileName, fileType, quality } = event.data;

  if (type === "compressImage") {
    try {
      const decoded = UPNG.decode(arrayBuffer);
      const rgba8 = UPNG.toRGBA8(decoded);
      const compressedData = UPNG.encode(rgba8, decoded.width, decoded.height, 256 * quality);

      const originalSize = arrayBuffer.byteLength;
      if (compressedData.byteLength >= originalSize) {
        self.postMessage({ success: true, data: arrayBuffer, fileName, fileType } satisfies CompressResult);
        return;
      }

      self.postMessage({ success: true, data: compressedData, fileName, fileType } satisfies CompressResult);
    } catch (error) {
      self.postMessage({
        success: false,
        error: error instanceof Error ? error.message : "压缩失败",
      } satisfies CompressResult);
    }
  }
});
