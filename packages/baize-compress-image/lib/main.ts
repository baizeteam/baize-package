// main.ts
import { DEFAULT_QUALITY } from "./config.ts";
import { checkImageSize, checkImageType } from "./utils.ts";
import CompressWorker from "./worker.ts?worker&inline";

export interface CompressBackInfo {
  compressInfo: {
    rate: number;
    time: number;
    originalSize: number;
    compressedSize: number;
  };
  file: File;
}

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
  startTime?: number;
  endTime?: number;
}

interface QueuedTask {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  quality: number;
  resolve: (value: CompressResult) => void;
  reject: (reason: any) => void;
}

class WorkerManager {
  private static instance: WorkerManager | undefined;
  private workers: Worker[] = [];
  private taskQueue: QueuedTask[] = [];
  private maxWorkers: number;
  private activeWorkers: Set<Worker> = new Set();

  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers;
    this.initializeWorkers();
  }

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  public setWorkerCount(count: number): void {
    if (count <= 0) return;

    // 终止现有的 workers
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.activeWorkers.clear();

    // 设置新的 worker 数量
    this.maxWorkers = count;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new CompressWorker();
      this.workers.push(worker);
    }
  }

  private getAvailableWorker(): Worker | null {
    return this.workers.find((worker) => !this.activeWorkers.has(worker)) || null;
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.getAvailableWorker();
    if (!availableWorker) return;

    const task = this.taskQueue.shift()!;
    this.executeTaskWithWorker(availableWorker, task);
  }

  private async executeTaskWithWorker(worker: Worker, task: QueuedTask): Promise<void> {
    this.activeWorkers.add(worker);

    try {
      const result = await this.runWorkerTask(worker, task);
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.activeWorkers.delete(worker);
      this.processNextTask(); // 处理队列中的下一个任务
    }
  }

  private runWorkerTask(worker: Worker, task: QueuedTask): Promise<CompressResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Worker timeout"));
        this.activeWorkers.delete(worker);
        this.processNextTask();
      }, 30000); // 30秒超时

      const startTime = Date.now();

      const handleMessage = (event: MessageEvent) => {
        clearTimeout(timeoutId);
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);

        const result = event.data as CompressResult;
        result.startTime = startTime;
        result.endTime = Date.now();
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || "压缩失败"));
        }
      };

      const handleError = (error: ErrorEvent) => {
        clearTimeout(timeoutId);
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
          arrayBuffer: task.arrayBuffer,
          fileName: task.fileName,
          fileType: task.fileType,
          quality: task.quality,
        },
        [task.arrayBuffer], // 使用 Transferable Objects
      );
    });
  }

  public async executeTask(
    arrayBuffer: ArrayBuffer,
    fileName: string,
    fileType: string,
    quality: number,
  ): Promise<CompressResult> {
    const availableWorker = this.getAvailableWorker();

    if (availableWorker) {
      // 如果有可用的 worker，直接执行
      return new Promise((resolve, reject) => {
        const task: QueuedTask = {
          arrayBuffer,
          fileName,
          fileType,
          quality,
          resolve,
          reject,
        };
        this.executeTaskWithWorker(availableWorker, task);
      });
    } else {
      // 如果没有可用的 worker，将任务加入队列
      return new Promise((resolve, reject) => {
        const task: QueuedTask = {
          arrayBuffer,
          fileName,
          fileType,
          quality,
          resolve,
          reject,
        };
        this.taskQueue.push(task);
      });
    }
  }

  public getQueueLength(): number {
    return this.taskQueue.length;
  }

  public getActiveWorkerCount(): number {
    return this.activeWorkers.size;
  }

  public terminate(): void {
    // 清空任务队列
    this.taskQueue.forEach((task) => {
      task.reject(new Error("Worker manager terminated"));
    });
    this.taskQueue = [];

    // 终止所有 worker
    this.workers.forEach((worker) => {
      worker.terminate();
    });
    this.workers = [];
    this.activeWorkers.clear();
  }
}

export interface CompressOptions {
  quality?: number;
  workerNum?: number;
}

const compressImageWorker = async (file: File, options: CompressOptions = {}): Promise<CompressBackInfo> => {
  const { quality = DEFAULT_QUALITY, workerNum = 4 } = options;

  // check
  checkImageType(file);
  checkImageSize(file);

  const workerManager = WorkerManager.getInstance();

  // 设置 worker 数量
  workerManager.setWorkerCount(workerNum);

  try {
    // 将文件转换为 ArrayBuffer 以便传输
    const arrayBuffer = await file.arrayBuffer();
    const originalSize = arrayBuffer.byteLength;

    // 使用 worker 压缩图片
    const result = await workerManager.executeTask(arrayBuffer, file.name, file.type, quality);

    if (!result.success || !result.data) {
      throw new Error(result.error || "压缩失败");
    }

    // 计算压缩率
    const compressedSize = result.data.byteLength;
    const compressRate = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;

    // 重新构造 File 对象
    const compressedFile = new File([result.data], result.fileName || file.name, {
      type: result.fileType || file.type,
    });

    return {
      compressInfo: {
        rate: Math.round(compressRate * 100) / 100, // 保留两位小数
        time: (result.endTime as number) - (result.startTime as number),
        originalSize: originalSize,
        compressedSize: compressedSize,
      },
      file: compressedFile,
    };
  } catch (error) {
    throw error;
  }
};

export const compressImagesWorker = async (
  files: File[],
  options: CompressOptions = {},
): Promise<PromiseSettledResult<CompressBackInfo>[]> => {
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
  return await allSettled(files.map((file) => compressImageWorker(file, options)));
};

export const cancelAllCompressWorker = () => {
  WorkerManager.getInstance().terminate();
};
