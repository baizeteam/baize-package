// main.ts
import Worker from "./worker.ts?worker&inline";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { DEFAUTL_FORAGE_CONFIG, DEFAULT_QUALITY } from "./config.ts";

const store = localforage.createInstance(DEFAUTL_FORAGE_CONFIG);

const worker = new Worker();

export const compressImageWorker = async (file: File, quality = DEFAULT_QUALITY): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    const id = nanoid(8);
    const taskData = {
      file,
      quality,
      id,
    };
    const taskId = `baize-compress-image-${id}`;
    await store.setItem(taskId, taskData);
    worker.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "compressImageSuccess") {
        const result = (await store.getItem(taskId)) as File;
        await store.removeItem(taskId);
        resolve(result);
      } else {
        reject(event.data);
      }
    };
    const message = {
      type: "compressImage",
      taskId,
    };
    worker.postMessage(JSON.stringify(message));
  });
};
