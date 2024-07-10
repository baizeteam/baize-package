// worker.ts
import "./localforage.min.js";
import "localforage";
import { DEFAUTL_FORAGE_CONFIG, DEFAULT_QUALITY } from "./config.js";

declare const localforage: LocalForage;
interface TaskType {
  file: File;
  taskId: string;
  quality: number;
}

const store = localforage.createInstance(DEFAUTL_FORAGE_CONFIG);

const compressJpegImage = async ({ img, quality }) => {
  const offscreen = new OffscreenCanvas(100, 100);
  const ctx = offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const imgData = await createImageBitmap(img);
  offscreen.width = imgData.width;
  offscreen.height = imgData.height;
  ctx.drawImage(imgData, 0, 0, offscreen.width, offscreen.height);
  const res = await offscreen.convertToBlob({ type: "image/jpeg", quality }).then((blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  });
  return res;
};

self.onmessage = async (event) => {
  const params = JSON.parse(event.data);
  if (params.type === "compressImage") {
    const taskData = (await store.getItem(params.taskId)) as TaskType;
    const file = taskData.file;
    const compressRes = await compressJpegImage({
      img: file.slice(0, file.size, file.type),
      quality: taskData.quality || DEFAULT_QUALITY,
    });
    store.removeItem(params.taskId);
    store.setItem(params.taskId, compressRes);
    self.postMessage(
      JSON.stringify({
        type: "compressImageSuccess",
        taskId: params.taskId,
      }),
    );
  }
};
