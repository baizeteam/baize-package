// worker.ts
import UPNG from "upng-js";
import workerpool from "workerpool";
import { isJpeg, isPng, isWebp } from "./utils";

export interface CompressResult {
  success: boolean;
  data?: ArrayBuffer;
  fileName?: string;
  fileType?: string;
  error?: string;
}

type CompressParamsType = {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  quality: number;
};

// 利用OffscreenCanvas压缩jpeg图片
const compressJpegImage = async ({ arrayBuffer, fileName, fileType, quality }: CompressParamsType): Promise<File> => {
  const blob = new Blob([arrayBuffer], { type: fileType });
  const offscreen = new OffscreenCanvas(100, 100);
  const ctx = offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const imgData = await createImageBitmap(blob);
  offscreen.width = imgData.width;
  offscreen.height = imgData.height;
  ctx.drawImage(imgData, 0, 0, offscreen.width, offscreen.height);
  const compressedBlob = await offscreen.convertToBlob({ type: fileType, quality });
  const newFile = new File([compressedBlob], fileName, { type: fileType, lastModified: Date.now() });
  return newFile;
};

// 利用UPNG压缩png图片
const compressPngImage = async ({ arrayBuffer, fileName, fileType, quality }: CompressParamsType): Promise<File> => {
  const decoded = UPNG.decode(arrayBuffer);
  const rgba8 = UPNG.toRGBA8(decoded);
  const compressImg = UPNG.encode(rgba8, decoded.width, decoded.height, 256 * quality);
  const compressFile = new File([compressImg], fileName, { type: fileType });
  return compressFile;
};

const compressImage = async (
  arrayBuffer: ArrayBuffer,
  fileName: string,
  fileType: string,
  quality: number,
): Promise<CompressResult> => {
  try {
    const params: CompressParamsType = {
      arrayBuffer,
      fileName,
      fileType,
      quality,
    };

    let compressedFile: File;

    if (isJpeg({ type: fileType } as File) || isWebp({ type: fileType } as File)) {
      compressedFile = await compressJpegImage(params);
    } else if (isPng({ type: fileType } as File)) {
      compressedFile = await compressPngImage(params);
    } else {
      throw new Error("Unsupported image type");
    }

    // 检查压缩效果
    const originalSize = arrayBuffer.byteLength;
    if (compressedFile.size >= originalSize) {
      // 如果压缩后文件更大，返回原始数据
      return {
        success: true,
        data: arrayBuffer,
        fileName,
        fileType,
      };
    }

    // 将压缩后的文件转换为 ArrayBuffer
    const compressedArrayBuffer = await compressedFile.arrayBuffer();
    return {
      success: true,
      data: compressedArrayBuffer,
      fileName,
      fileType,
    };
  } catch (error) {
    console.error("[baize-compress-image] compressImage error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "压缩失败",
    };
  }
};

workerpool.worker({
  compressImage,
});
