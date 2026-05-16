import type { CompressResult } from "../../types";

self.addEventListener("message", async (event) => {
  const { type, arrayBuffer, fileName, fileType, quality } = event.data;

  if (type === "compressImage") {
    try {
      const blob = new Blob([arrayBuffer], { type: fileType });
      const offscreen = new OffscreenCanvas(100, 100);
      const ctx = offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
      const imgData = await createImageBitmap(blob);
      offscreen.width = imgData.width;
      offscreen.height = imgData.height;
      ctx.drawImage(imgData, 0, 0, offscreen.width, offscreen.height);
      const compressedBlob = await offscreen.convertToBlob({ type: fileType, quality });

      const originalSize = arrayBuffer.byteLength;
      if (compressedBlob.size >= originalSize) {
        self.postMessage({ success: true, data: arrayBuffer, fileName, fileType } satisfies CompressResult);
        return;
      }

      const compressedArrayBuffer = await compressedBlob.arrayBuffer();
      self.postMessage({ success: true, data: compressedArrayBuffer, fileName, fileType } satisfies CompressResult);
    } catch (error) {
      self.postMessage({
        success: false,
        error: error instanceof Error ? error.message : "压缩失败",
      } satisfies CompressResult);
    }
  }
});
