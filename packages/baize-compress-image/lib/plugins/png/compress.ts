import UPNG from "upng-js";
import type { CompressPayload, CompressResult } from "../../types";

export async function compress({ arrayBuffer, fileName, fileType, quality }: CompressPayload): Promise<CompressResult> {
  const decoded = UPNG.decode(arrayBuffer);
  const rgba8 = UPNG.toRGBA8(decoded);
  const compressedData = UPNG.encode(rgba8, decoded.width, decoded.height, 256 * (quality ?? 0.8));

  const originalSize = arrayBuffer.byteLength;
  if (compressedData.byteLength >= originalSize) {
    return { success: true, data: arrayBuffer, fileName, fileType };
  }

  return { success: true, data: compressedData, fileName, fileType };
}
