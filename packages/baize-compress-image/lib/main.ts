import { checkImageSize } from "./utils.ts";
import { WorkerManager } from "./workerManage.ts";
import type { CompressPlugin, CompressBackInfo } from "./types.ts";

export type {
  CompressPlugin,
  CompressBackInfo,
  CompressPluginConfig,
  CompressPayload,
  CompressResult,
} from "./types.ts";

export interface ImageCompressorOptions {
  workerNum?: number;
  plugins: CompressPlugin[];
}

export class ImageCompressor {
  private workerManager: WorkerManager;
  private plugins: CompressPlugin[];

  constructor(params: ImageCompressorOptions) {
    this.plugins = params.plugins;
    this.workerManager = new WorkerManager(this.plugins, params.workerNum || 4);
  }

  private checkImageType(file: File): void {
    if (!this.plugins.some((p) => p.matches(file.type))) {
      throw new Error("Unsupported image type");
    }
  }

  private compressImage = async (file: File): Promise<CompressBackInfo> => {
    this.checkImageType(file);
    checkImageSize(file);

    const arrayBuffer = await file.arrayBuffer();
    const originalSize = arrayBuffer.byteLength;

    const result = await this.workerManager.executeTask(arrayBuffer, file.name, file.type);

    if (!result.success || !result.data) {
      throw new Error(result.error || "压缩失败");
    }

    const compressedSize = result.data.byteLength;
    const compressRate = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;

    const compressedFile = new File([result.data], result.fileName || file.name, {
      type: result.fileType || file.type,
    });

    return {
      compressInfo: {
        rate: Math.round(compressRate * 100) / 100,
        time: (result as any).endTime - (result as any).startTime,
        originalSize,
        compressedSize,
      },
      file: compressedFile,
    };
  };

  public compressImagesWorker = async (
    files: File[],
  ): Promise<PromiseSettledResult<CompressBackInfo>[]> => {
    let allSettled: typeof Promise.allSettled;
    if (!Promise.allSettled) {
      const rejectHandler = (reason: any) => ({ status: "rejected", reason });
      const resolveHandler = (value: any) => ({ status: "fulfilled", value });
      allSettled = function (promises: any) {
        const convertedPromises = promises.map((p: any) => Promise.resolve(p).then(resolveHandler, rejectHandler));
        return Promise.all(convertedPromises);
      };
    } else {
      allSettled = Promise.allSettled.bind(Promise);
    }
    return await allSettled(files.map((file) => this.compressImage(file)));
  };

  public cancelAll(): void {
    this.workerManager.terminate();
  }
}
