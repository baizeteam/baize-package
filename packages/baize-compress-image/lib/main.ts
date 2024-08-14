// main.ts
import { DEFAULT_FORAGE_CONFIG, DEFAULT_QUALITY } from "./config.ts";
import { checkImageSize, checkImageType, uuid } from "./utils.ts";
import WorkerURL from "./worker.ts?worker&url";
import localforage from "localforage";
import workerpool from "workerpool";
import type { Pool } from "workerpool";

export interface TaskType {
  file: File;
  quality: number;
}
let POOL_INSTANCE: Pool | undefined;
const getPool = () => {
  if (!POOL_INSTANCE) {
    POOL_INSTANCE = workerpool.pool(WorkerURL, {
      workerOpts: {
        type: import.meta.env.PROD ? undefined : "module",
      },
    });
  }
  return POOL_INSTANCE;
};
const terminatePool = (force = false) => {
  if (POOL_INSTANCE) {
    POOL_INSTANCE.terminate(force);
    POOL_INSTANCE = undefined;
  }
};

export const compressImageWorker = async (file: File, quality = DEFAULT_QUALITY): Promise<File> => {
  // check
  checkImageType(file);
  checkImageSize(file);

  // init
  const id = uuid();
  const taskId = `baize-compress-image-${id}`;
  const taskData = {
    file,
    quality,
  };
  // TODO indexDB存储，会有IO瓶颈问题，后续考虑使用PostMessage.Transferable传递数据
  const store = localforage.createInstance(DEFAULT_FORAGE_CONFIG);
  const pool = getPool();

  try {
    // compressing
    await store.setItem<TaskType>(taskId, taskData);
    await pool.exec("compressImageByTaskId", [taskId]);
    // result
    const compressRes = await store.getItem<TaskType>(taskId);
    if (!compressRes) throw new Error("compressImageWorker failed");
    // reset
    store.removeItem(taskId);
    setTimeout(() => {
      if (pool.stats().busyWorkers === 0) terminatePool();
    }, 1000);
    // return
    return compressRes.file;
  } catch (error) {
    // reset
    store.removeItem(taskId);
    setTimeout(() => {
      if (pool.stats().busyWorkers === 0) terminatePool();
    }, 1000);
    // throw
    throw error;
  }
};

export const compressImagesWorker = async (files: File[], quality = DEFAULT_QUALITY) => {
  let allSettled: typeof Promise.allSettled;
  // polyfill
  if (!Promise.allSettled) {
    const rejectHandler = (reason: any) => ({ status: "rejected", reason });

    const resolveHandler = (value: any) => ({ status: "fulfilled", value });

    allSettled = function (promises: any) {
      const convertedPromises = promises.map((p: any) => Promise.resolve(p).then(resolveHandler, rejectHandler));
      return Promise.all(convertedPromises);
    };
  } else {
    // https://stackoverflow.com/questions/48399756/calling-promise-all-throws-promise-all-called-on-non-object
    allSettled = Promise.allSettled.bind(Promise);
  }
  return await allSettled(files.map((file) => compressImageWorker(file, quality)));
};

export const cancelAllCompressWorker = () => {
  terminatePool(true);
};
