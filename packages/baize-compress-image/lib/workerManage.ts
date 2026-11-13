import SharedWorker from "./sharedWorker.ts?worker";
import type { CompressPlugin, CompressPluginConfig, CompressResult } from "./types";

interface QueuedTask {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  moduleUrl: string;
  config: CompressPluginConfig;
  resolve: (value: CompressResult) => void;
  reject: (reason: any) => void;
}

export class WorkerManager {
  private plugins: CompressPlugin[];
  private workers: Worker[] = [];
  private active = new Set<Worker>();
  private taskQueue: QueuedTask[] = [];
  private maxWorkers: number;

  constructor(plugins: CompressPlugin[], maxWorkers = 4) {
    this.plugins = plugins;
    this.maxWorkers = maxWorkers;
  }

  private findPlugin(fileType: string): CompressPlugin | null {
    return this.plugins.find((plugin) => plugin.matches(fileType)) ?? null;
  }

  private ensurePool(): void {
    while (this.workers.length < this.maxWorkers) {
      this.workers.push(new SharedWorker());
    }
  }

  private replaceWorker(worker: Worker): void {
    const index = this.workers.indexOf(worker);
    if (index >= 0) {
      this.workers[index] = new SharedWorker();
    }
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const worker = this.workers.find((item) => !this.active.has(item));
    if (!worker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    void this.executeTaskWithWorker(worker, task);
    this.processNextTask();
  }

  private async executeTaskWithWorker(worker: Worker, task: QueuedTask): Promise<void> {
    this.active.add(worker);

    try {
      const result = await this.runWorkerTask(worker, task);
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.active.delete(worker);
      this.processNextTask();
    }
  }

  private runWorkerTask(worker: Worker, task: QueuedTask): Promise<CompressResult> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        clearTimeout(timeoutId);
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
      };

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        worker.terminate();
        this.replaceWorker(worker);
        this.active.delete(worker);
        reject(new Error("Worker timeout"));
        this.processNextTask();
      }, 30000);

      const startTime = Date.now();

      const handleMessage = (event: MessageEvent) => {
        if (settled) return;
        settled = true;
        cleanup();

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
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Worker error: ${error.message}`));
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      worker.postMessage(
        {
          type: "compressImage",
          moduleUrl: task.moduleUrl,
          arrayBuffer: task.arrayBuffer,
          fileName: task.fileName,
          fileType: task.fileType,
          ...task.config,
        },
        [task.arrayBuffer],
      );
    });
  }

  public async executeTask(arrayBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<CompressResult> {
    const plugin = this.findPlugin(fileType);
    if (!plugin) {
      throw new Error(`Unsupported image type: ${fileType}`);
    }
    if (!plugin.moduleUrl) {
      throw new Error(`插件 ${plugin.name} 缺少 moduleUrl`);
    }

    this.ensurePool();

    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        arrayBuffer,
        fileName,
        fileType,
        moduleUrl: plugin.moduleUrl,
        config: plugin.defaultConfig,
        resolve,
        reject,
      });
      this.processNextTask();
    });
  }

  public terminate(): void {
    this.taskQueue.forEach((task) => {
      task.reject(new Error("Worker manager terminated"));
    });
    this.taskQueue = [];

    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.active.clear();
  }
}
