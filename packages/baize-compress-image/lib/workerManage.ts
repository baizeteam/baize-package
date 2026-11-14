import workerUrl from "./pool.worker.ts?worker&url";
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
  private workers = new Set<Worker>();
  private active = new Set<Worker>();
  private runningTasks = new Map<Worker, (error: Error) => void>();
  private taskQueue: QueuedTask[] = [];
  private maxWorkers: number;

  constructor(plugins: CompressPlugin[], maxWorkers = 4) {
    this.plugins = plugins;
    this.maxWorkers = maxWorkers;
  }

  private findPlugin(fileType: string): CompressPlugin | null {
    return this.plugins.find((plugin) => plugin.matches(fileType)) ?? null;
  }

  private processNextTask(): void {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      let worker = [...this.workers].find((item) => !this.active.has(item));

      if (!worker) {
        if (this.workers.size >= this.maxWorkers) return;
        try {
          // 部分打包器返回站点路径，统一相对页面解析，避免落到 file:// 基地址。
          worker = new Worker(new URL(workerUrl, globalThis.location.href), { type: "module" });
          this.workers.add(worker);
        } catch (error) {
          this.taskQueue.shift();
          task.reject(error);
          continue;
        }
      }

      this.taskQueue.shift();
      void this.executeTaskWithWorker(worker, task);
    }
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
        this.runningTasks.delete(worker);
      };

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        worker.terminate();
        this.workers.delete(worker);
        reject(new Error("Worker timeout"));
      }, 30_000);

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
        worker.terminate();
        this.workers.delete(worker);
        reject(new Error(`Worker error: ${error.message}`));
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);
      this.runningTasks.set(worker, (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      });

      try {
        worker.postMessage(
          {
            ...task.config,
            type: "compress",
            moduleUrl: task.moduleUrl,
            arrayBuffer: task.arrayBuffer,
            fileName: task.fileName,
            fileType: task.fileType,
          },
          [task.arrayBuffer],
        );
      } catch (error) {
        settled = true;
        cleanup();
        reject(error);
      }
    });
  }

  public async executeTask(arrayBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<CompressResult> {
    const plugin = this.findPlugin(fileType);
    if (!plugin) {
      throw new Error(`Unsupported image type: ${fileType}`);
    }
    if (typeof plugin.moduleUrl !== "string" || !plugin.moduleUrl) {
      throw new Error(`插件 ${plugin.name} 缺少压缩模块入口`);
    }
    const moduleUrl = new URL(plugin.moduleUrl, globalThis.location.href).href;

    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        arrayBuffer,
        fileName,
        fileType,
        moduleUrl,
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

    this.runningTasks.forEach((reject) => reject(new Error("Worker manager terminated")));
    this.workers.forEach((worker) => worker.terminate());
    this.workers.clear();
    this.active.clear();
  }
}
