// worker.ts
import { DEFAULT_FORAGE_CONFIG } from "./config";
import localforage from "localforage";
import UPNG from "upng-js";
import workerpool from "workerpool";
import type { TaskType } from "./main";
import { isJpeg, isPng, isWebp } from "./utils";

type CompressParamsType = {
  file: File;
  quality: number;
};

// 利用OffscreenCanvas压缩jpeg图片
const compressJpegImage = async ({ file, quality }: CompressParamsType) => {
  const img = file.slice(0, file.size, file.type);
  const offscreen = new OffscreenCanvas(100, 100);
  const ctx = offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const imgData = await createImageBitmap(img);
  offscreen.width = imgData.width;
  offscreen.height = imgData.height;
  ctx.drawImage(imgData, 0, 0, offscreen.width, offscreen.height);
  const blob = await offscreen.convertToBlob({ type: file.type, quality });
  const newFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });
  return newFile;
};

// 利用UPNG压缩png图片
const compressPngImage = async ({ file, quality }: CompressParamsType) => {
  const arrayBuffer = await file.arrayBuffer();
  const decoded = UPNG.decode(arrayBuffer);
  const rgba8 = UPNG.toRGBA8(decoded);
  const compressImg = UPNG.encode(rgba8, decoded.width, decoded.height, 256 * quality);
  const compressFile = new File([compressImg], file.name, { type: file.type });
  return compressFile;
};

const compressImage = async ({ file, quality }: CompressParamsType) => {
  if (isJpeg(file) || isWebp(file)) {
    return await compressJpegImage({ file, quality });
  } else if (isPng(file)) {
    return await compressPngImage({ file, quality });
  } else {
    throw new Error("Unsupported image type");
  }
};

const compressImageByTaskId = async (taskId: string) => {
  const store = localforage.createInstance(DEFAULT_FORAGE_CONFIG);

  try {
    const taskData = await store.getItem<TaskType>(taskId);
    if (!taskData?.file) throw new Error("compress image not found");

    const file = taskData.file;
    const compressRes = await compressImage({
      file: file,
      quality: taskData.quality,
    });
    if (compressRes.size < file.size) {
      // 压缩后大小小于原文件大小，则替换原文件
      await store.setItem<TaskType>(taskId, {
        file: compressRes,
        quality: taskData.quality,
      });
    } else {
      // 压缩后大小大于原文件大小，则保留原文件
      // store.setItem(taskId, file);
    }
  } catch (error) {
    console.error("[baize-compress-image] compressImage error:", error);
    await store.removeItem(taskId);
    throw error;
  }
};

workerpool.worker({
  compressImageByTaskId,
});
