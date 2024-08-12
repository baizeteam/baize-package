// worker.ts
import "./localforage.min.js";
import "./pako.min.js";
import "./UPNG.min.js";
import "localforage";
import { DEFAULT_FORAGE_CONFIG, DEFAULT_QUALITY } from "./config.js";

declare const localforage: LocalForage;
declare const UPNG: any;
interface TaskType {
  file: File;
  taskId: string;
  quality: number;
}

const store = localforage.createInstance(DEFAULT_FORAGE_CONFIG);

// 利用OffscreenCanvas压缩jpeg图片
const compressJpegImage = async ({ file, quality }) => {
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
const compressPngImage = async ({ file, quality }) => {
  const arrayBuffer = await file.arrayBuffer();
  const decoded = UPNG.decode(arrayBuffer);
  const rgba8 = UPNG.toRGBA8(decoded);
  const compressImg = UPNG.encode(rgba8, decoded.width, decoded.height, 256 * quality);
  const compressFile = new File([compressImg], file.name, { type: file.type });
  return compressFile;
};

const compressImage = async ({ file, quality }) => {
  const type = file.type.split("/")[1];
  if (type === "jpeg" || type === "jpg" || type === "webp") {
    return await compressJpegImage({ file, quality });
  } else if (type === "png") {
    return await compressPngImage({ file, quality });
  } else {
    throw new Error("Unsupported image type");
  }
};

self.onmessage = async (event) => {
  const params = JSON.parse(event.data);
  if (params.type === "compressImage") {
    const taskData = (await store.getItem(params.taskId)) as TaskType;
    await store.removeItem(params.taskId);
    const file = taskData.file;
    const compressRes = await compressImage({
      file: file,
      quality: taskData.quality || DEFAULT_QUALITY,
    });
    if (compressRes.size < file.size) {
      // 压缩后大小小于原文件大小，则替换原文件
      store.setItem(params.taskId, compressRes);
    } else {
      store.setItem(params.taskId, file);
    }
    self.postMessage(
      JSON.stringify({
        type: "compressImageSuccess",
        taskId: params.taskId,
      }),
    );
  }
};
