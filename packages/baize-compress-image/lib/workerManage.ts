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

export class WorkerManager {
  private workers: Worker[] = [];
  private taskQueue: QueuedTask[] = [];
  private maxWorkers: number;
  private activeWorkers: Set<Worker> = new Set();

  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers;
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
      const task: QueuedTask = {
        arrayBuffer,
        fileName,
        fileType,
        quality,
        resolve: () => {},
        reject: () => {},
      };
      return new Promise((resolve, reject) => {
        task.resolve = resolve;
        task.reject = reject;
        this.executeTaskWithWorker(availableWorker, task);
      });
    } else {
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
