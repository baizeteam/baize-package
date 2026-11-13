import { optimize } from "svgo/browser";
import type { CompressPayload, CompressResult } from "../../types";

export async function compress({
  arrayBuffer,
  fileName,
  fileType,
  floatPrecision,
  svgoPlugins,
}: CompressPayload): Promise<CompressResult> {
  const svgString = new TextDecoder().decode(arrayBuffer);
  const result = optimize(svgString, {
    floatPrecision: floatPrecision ?? 8,
    plugins: svgoPlugins ?? ["preset-default", "removeDimensions"],
  });
  const compressedData = new TextEncoder().encode(result.data);
  const compressedBuffer = compressedData.buffer.slice(
    compressedData.byteOffset,
    compressedData.byteOffset + compressedData.byteLength,
  );

  const originalSize = arrayBuffer.byteLength;
  if (compressedBuffer.byteLength >= originalSize) {
    return { success: true, data: arrayBuffer, fileName, fileType };
  }

  return { success: true, data: compressedBuffer, fileName, fileType };
}

export { compress as func };
