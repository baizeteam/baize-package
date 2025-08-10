// main.ts
import { DEFAULT_QUALITY } from "./config.ts";
import { checkImageSize, checkImageType } from "./utils.ts";
import WorkerURL from "./worker.ts?worker&url";
import workerpool from "workerpool";
import type { Pool } from "workerpool";

export interface TaskType {
  file: File;
  quality: number;
}

export interface CompressResult {
  success: boolean;
  data?: ArrayBuffer;
  fileName?: string;
  fileType?: string;
  error?: string;
}

class PoolInstance {
  private static instance: Pool | undefined;

  public static getPool(): Pool {
    if (!PoolInstance.instance) {
      PoolInstance.instance = workerpool.pool(WorkerURL, {
        workerOpts: {
          type: import.meta.env.PROD ? undefined : "module",
        },
      });
    }
    return PoolInstance.instance;
  }

  public static terminatePool(force = false): void {
    if (PoolInstance.instance) {
      PoolInstance.instance.terminate(force);
      PoolInstance.instance = undefined;
    }
  }
}

const compressImageWorker = async (file: File, quality = DEFAULT_QUALITY): Promise<File> => {
  // check
  checkImageType(file);
  checkImageSize(file);

  const pool = PoolInstance.getPool();

  try {
    // 将文件转换为 ArrayBuffer 以便传输
    const arrayBuffer = await file.arrayBuffer();

    // 使用 Transferable Objects 传递数据
    const result = (await pool.exec("compressImage", [arrayBuffer, file.name, file.type, quality], {
      transfer: [arrayBuffer],
    })) as CompressResult;

    if (!result.success || !result.data) {
      throw new Error(result.error || "压缩失败");
    }

    // 清理资源
    setTimeout(() => {
      if (pool.stats().busyWorkers === 0) PoolInstance.terminatePool();
    }, 1000);

    // 重新构造 File 对象
    return new File([result.data], result.fileName || file.name, {
      type: result.fileType || file.type,
    });
  } catch (error) {
    // 清理资源
    setTimeout(() => {
      if (pool.stats().busyWorkers === 0) PoolInstance.terminatePool();
    }, 1000);

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
  PoolInstance.terminatePool(true);
};
