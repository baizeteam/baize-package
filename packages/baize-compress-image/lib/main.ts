// main.ts
import Worker from "./worker.ts?worker&inline";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { DEFAUTL_FORAGE_CONFIG, DEFAULT_QUALITY } from "./config.ts";
import { UPNG } from "upng-js";
import { transfer } from "comlink";

const store = localforage.createInstance(DEFAUTL_FORAGE_CONFIG);

const worker = new Worker();

// export const compressImageWorker = async (file: File, quality = DEFAULT_QUALITY) => {
//   return new Promise(async (resolve, reject) => {
//     const id = nanoid(8);
//     const taskData = {
//       file,
//       quality,
//       id,
//     };
//     const taskId = `baize-compress-image-${id}`;
//     await store.setItem(taskId, taskData);
//     worker.onmessage = async (event) => {
//       const message = JSON.parse(event.data);
//       if (message.type === "compressImageSuccess") {
//         const result = await store.getItem(taskId);
//         await store.removeItem(taskId);
//         resolve(result);
//       } else {
//         reject(event.data);
//       }
//     };
//     const message = {
//       type: "compressImage",
//       taskId,
//     };
//     worker.postMessage(JSON.stringify(message));
//   });
// };


// 返回出颜色深度的值，用于计算 size * colorDepth 得出原图片尺寸
function getColorDepth(imageData: ImageData): number {
  const data = imageData.data;
  if (data.length === imageData.width * imageData.height * 3) {
    return 24; // 每个像素 3 字节，即 24 位真彩色
  } else if (data.length === imageData.width * imageData.height * 4) {
    return 32; // 每个像素 4 字节，可能是 32 位 ARGB 等格式
  }
  // 对于其他不常见的情况，返回默认值 24
  return 24;
}

// compressImageWorker 函数定义
export async function compressImageWorker(file: File): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    // 想要打印出原始图像文件的大小（即未压缩前的大小），您可以在 FileReader 的 onload 事件中通过 e.target.result 的长度来获取
    // 因为 readAsDataURL 方法会以 Base64 编码的形式读取文件，其结果长度可以用来近似原始文件的大小
    // （Base64 编码会将原始数据的每3个字节转换为4个字符，所以需要除以4再乘以3来近似原始大小）

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        // 根据文件类型生成对应的 Base64 前缀
        const base64Prefix = `data:${file.type};base64,`;
        // 获取原始文件大小
        const base64Data = e.target.result as string;
        const originalSizeInBytes = (base64Data.length - base64Prefix.length) * (3/4);

        const image = new Image();
        image.src = e.target.result as string;
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // const colorDepth = getColorDepth(imageData);
          // // 计算原来的size
          // const originalSizeInBytes = image.width * image.height * colorDepth / 8;

          let blob: Blob;
          if (file.type === 'image/png') {
            // PNG 图片的压缩逻辑
            const arrayBuffer = new Uint8Array(e.target.result as ArrayBuffer);
            const pngData = UPNG.decode(arrayBuffer);
            const compressedPngData = UPNG.encode(pngData, {
              colorType: 6, // 6 表示 RGBA
              filter: 0, // 无过滤
              compressionLevel: 2 // 压缩级别
            });
            blob = new Blob([compressedPngData], { type: 'image/png' });
          } else {
            // 其他图片类型的压缩逻辑（JPEG, WebP 等）
            blob = new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(new Error('Could not create compressed blob'));
                }
              }, file.type, 0.7); // 设置压缩质量为 0.8
            });
          }

          // 等待 Blob 创建完成
          Promise.resolve(blob).then((result) => {
            console.log(`Original size: ${originalSizeInBytes} bytes`);
            console.log(`Compressed size: ${result.size} bytes`);
            resolve(transfer(result, [result]));
          }).catch(reject);
        };
        image.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}
