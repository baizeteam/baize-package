import type { CompressPayload, CompressResult } from "../../types";

export async function compress({ arrayBuffer, fileName, fileType, quality }: CompressPayload): Promise<CompressResult> {
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
    return { success: true, data: arrayBuffer, fileName, fileType };
  }

  return { success: true, data: await compressedBlob.arrayBuffer(), fileName, fileType };
}
