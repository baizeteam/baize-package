// main.ts
import { DEFAULT_QUALITY } from "./config.ts";
import { checkImageSize, checkImageType } from "./utils.ts";
import CompressWorker from "./worker.ts?worker&inline";

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

class WorkerManager {
  private static instance: WorkerManager | undefined;
  private worker: Worker | null = null;
  private isProcessing = false;

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  private createWorker(): Worker {
    if (!this.worker) {
      this.worker = new CompressWorker();
    }
    return this.worker;
  }

  public async executeTask(
    arrayBuffer: ArrayBuffer,
    fileName: string,
    fileType: string,
    quality: number,
  ): Promise<CompressResult> {
    if (this.isProcessing) {
      throw new Error("Worker is busy, please try again later");
    }

    this.isProcessing = true;
    const worker = this.createWorker();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Worker timeout"));
        this.isProcessing = false;
      }, 30000); // 30秒超时

      const handleMessage = (event: MessageEvent) => {
        clearTimeout(timeoutId);
        this.isProcessing = false;
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);

        const result = event.data as CompressResult;
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || "压缩失败"));
        }
      };

      const handleError = (error: ErrorEvent) => {
        clearTimeout(timeoutId);
        this.isProcessing = false;
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        reject(new Error(`Worker error: ${error.message}`));
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      // 发送数据到 worker
      worker.postMessage(
        {
          type: "compressImage",
          arrayBuffer,
          fileName,
          fileType,
          quality,
        },
        [arrayBuffer],
      ); // 使用 Transferable Objects
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isProcessing = false;
  }
}

const compressImageWorker = async (file: File, quality = DEFAULT_QUALITY): Promise<File> => {
  // check
  checkImageType(file);
  checkImageSize(file);

  const workerManager = WorkerManager.getInstance();

  try {
    // 将文件转换为 ArrayBuffer 以便传输
    const arrayBuffer = await file.arrayBuffer();

    // 使用 worker 压缩图片
    const result = await workerManager.executeTask(arrayBuffer, file.name, file.type, quality);

    if (!result.success || !result.data) {
      throw new Error(result.error || "压缩失败");
    }

    // 重新构造 File 对象
    return new File([result.data], result.fileName || file.name, {
      type: result.fileType || file.type,
    });
  } catch (error) {
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
  WorkerManager.getInstance().terminate();
};
