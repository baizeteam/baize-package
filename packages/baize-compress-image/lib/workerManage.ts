import type { CompressPlugin, CompressPluginConfig, CompressResult } from "./types";

interface QueuedTask {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  config: CompressPluginConfig;
  resolve: (value: CompressResult) => void;
  reject: (reason: any) => void;
}

export class WorkerManager {
  private pluginPools: Map<string, { plugin: CompressPlugin; workers: Worker[]; active: Set<Worker> }> = new Map();
  private taskQueue: QueuedTask[] = [];
  private maxWorkersPerPlugin: number;

  constructor(plugins: CompressPlugin[], maxWorkersPerPlugin = 4) {
    this.maxWorkersPerPlugin = maxWorkersPerPlugin;
    for (const plugin of plugins) {
      this.pluginPools.set(plugin.name, { plugin, workers: [], active: new Set() });
    }
  }

  private getPoolForFileType(fileType: string) {
    for (const pool of this.pluginPools.values()) {
      if (pool.plugin.matches(fileType)) return pool;
    }
    return null;
  }

  private getAvailableWorker(pool: { workers: Worker[]; active: Set<Worker> }): Worker | null {
    return pool.workers.find((w) => !pool.active.has(w)) || null;
  }

  private fillPool(pool: { plugin: CompressPlugin; workers: Worker[] }): void {
    while (pool.workers.length < this.maxWorkersPerPlugin) {
      pool.workers.push(pool.plugin.createWorker());
    }
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    for (let i = 0; i < this.taskQueue.length; i++) {
      const task = this.taskQueue[i];
      const pool = this.getPoolForFileType(task.fileType);
      if (!pool) continue;

      if (pool.workers.length < this.maxWorkersPerPlugin) {
        const worker = pool.plugin.createWorker();
        pool.workers.push(worker);
        this.taskQueue.splice(i, 1);
        this.executeTaskWithWorker(pool, worker, task);
        return;
      }

      const availableWorker = this.getAvailableWorker(pool);
      if (availableWorker) {
        this.taskQueue.splice(i, 1);
        this.executeTaskWithWorker(pool, availableWorker, task);
        return;
      }
    }
  }

  private async executeTaskWithWorker(
    pool: { active: Set<Worker> },
    worker: Worker,
    task: QueuedTask,
  ): Promise<void> {
    pool.active.add(worker);

    try {
      const result = await this.runWorkerTask(pool, worker, task);
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      pool.active.delete(worker);
      this.processNextTask();
    }
  }

  private runWorkerTask(
    pool: { active: Set<Worker> },
    worker: Worker,
    task: QueuedTask,
  ): Promise<CompressResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Worker timeout"));
        pool.active.delete(worker);
        this.processNextTask();
      }, 30000);

      const startTime = Date.now();

      const handleMessage = (event: MessageEvent) => {
        clearTimeout(timeoutId);
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);

        const result = event.data as CompressResult;
        (result as any).startTime = startTime;
        (result as any).endTime = Date.now();
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

      worker.postMessage(
        {
          type: "compressImage",
          arrayBuffer: task.arrayBuffer,
          fileName: task.fileName,
          fileType: task.fileType,
          ...task.config,
        },
        [task.arrayBuffer],
      );
    });
  }

  public async executeTask(
    arrayBuffer: ArrayBuffer,
    fileName: string,
    fileType: string,
  ): Promise<CompressResult> {
    const pool = this.getPoolForFileType(fileType);
    if (!pool) {
      throw new Error(`Unsupported image type: ${fileType}`);
    }

    if (pool.workers.length === 0) {
      this.fillPool(pool);
    }

    const availableWorker = this.getAvailableWorker(pool);

    if (availableWorker) {
      const task: QueuedTask = {
        arrayBuffer,
        fileName,
        fileType,
        config: pool.plugin.defaultConfig,
        resolve: () => {},
        reject: () => {},
      };
      return new Promise((resolve, reject) => {
        task.resolve = resolve;
        task.reject = reject;
        this.executeTaskWithWorker(pool, availableWorker, task);
      });
    } else {
      return new Promise((resolve, reject) => {
        const task: QueuedTask = {
          arrayBuffer,
          fileName,
          fileType,
          config: pool.plugin.defaultConfig,
          resolve,
          reject,
        };
        this.taskQueue.push(task);
      });
    }
  }

  public terminate(): void {
    this.taskQueue.forEach((task) => {
      task.reject(new Error("Worker manager terminated"));
    });
    this.taskQueue = [];

    for (const pool of this.pluginPools.values()) {
      pool.workers.forEach((w) => w.terminate());
      pool.workers = [];
      pool.active.clear();
    }
  }
}
