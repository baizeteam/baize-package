import { ACCEPT_IMG_TYPES, DEFAULT_FORAGE_CONFIG, DEFAULT_QUALITY } from "./config";
import Worker from "./worker.ts?worker&inline";
import { nanoid } from "nanoid";
import localforage from "localforage";

interface CompressOptions {
  quality?: number;
  // TODO 需要支持“取消压缩”功能；实现方向可以参考：
  // 1. 类似于AbortController，传入一个AbortSignal对象，当调用abort方法时，中断压缩任务；
  // 2. 或者参考removeEventListener的方式，传入一个函数，当调用该函数时，中断压缩任务；
  signal?: AbortSignal;
}
type CompressSingleType = (file: File, options: CompressOptions) => Promise<File>;

export const compressSingle: CompressSingleType = async (file, options) => {
  // @ts-expect-error: signal留个坑
  const { quality = DEFAULT_QUALITY, signal } = options;
  checkImageType(file);
  // TODO 检查图片大小
  // 1. 如果图片大小小于一定值，不进行压缩，避免压缩后体积变大
  // 2. 如果图片大小大于一定值，也不进行压缩，避免内存溢出

  const id = nanoid(8);
  const taskData = {
    file,
    quality,
    id,
  };
  const taskId = `baize-compress-image-${id}`;

  const worker = new Worker();
  // TODO indexDB存储，会有IO瓶颈问题，后续考虑使用PostMessage.Transferable传递数据
  const store = localforage.createInstance(DEFAULT_FORAGE_CONFIG);
  await store.setItem(taskId, taskData);

  return new Promise((resolve, reject) => {
    worker.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "compressImageSuccess") {
        const result = (await store.getItem(taskId)) as File;
        resolve(result);
      } else {
        reject(event.data);
      }
      // reset
      worker.terminate();
      await store.removeItem(taskId);
    };

    const message = {
      type: "compressImage",
      taskId,
    };
    worker.postMessage(JSON.stringify(message));
  });
};

export const checkImageType = (file: File) => {
  // 检查图片类型,根据 ACCEPT_IMG_TYPES 判断
  if (!ACCEPT_IMG_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type");
  }
};

export const transformBytes2HumanRead = (bytes: number) => {
  if (isNaN(bytes)) {
    return "";
  }
  const symbols = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let exp = Math.floor(Math.log(bytes) / Math.log(2));
  if (exp < 1) {
    exp = 0;
  }
  const i = Math.floor(exp / 10);
  bytes = bytes / Math.pow(2, 10 * i);

  let bytesString = "";

  if (bytes.toString().length > bytes.toFixed(2).toString().length) {
    bytesString = bytes.toFixed(2);
  } else {
    bytesString = `${bytes}`;
  }
  return bytesString + " " + symbols[i];
};
