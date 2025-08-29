// main.ts
import { DEFAULT_QUALITY } from "./config.ts";
import { checkImageSize, checkImageType } from "./utils.ts";
import { CompressBackInfo, WorkerManager } from "./workerManage.ts";

export interface CompressOptions {
  quality?: number;
}

export class ImageCompressor {
  private workerManager: WorkerManager;
  constructor(params: { workerNum?: number }) {
    this.workerManager = new WorkerManager(params.workerNum || 4);
  }

  private compressImage = async (file: File, options: CompressOptions = {}): Promise<CompressBackInfo> => {
    const { quality = DEFAULT_QUALITY } = options;

    // check
    checkImageType(file);
    checkImageSize(file);

    try {
      // 将文件转换为 ArrayBuffer 以便传输
      const arrayBuffer = await file.arrayBuffer();
      const originalSize = arrayBuffer.byteLength;

      // 使用 worker 压缩图片
      const result = await this.workerManager.executeTask(arrayBuffer, file.name, file.type, quality);

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

  public compressImagesWorker = async (
    files: File[],
    options: CompressOptions,
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
    return await allSettled(files.map((file) => this.compressImage(file, options)));
  };

  public cancelAll(): void {
    this.workerManager.terminate();
  }
}
