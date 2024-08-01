// main.ts
import Worker from "./worker.ts?worker&inline";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { DEFAUTL_FORAGE_CONFIG, DEFAULT_QUALITY } from "./config.ts";
import { UPNG } from "upng-js";
import { transfer } from "comlink";

const store = localforage.createInstance(DEFAUTL_FORAGE_CONFIG);

const worker = new Worker();


/** compressImageWorker 函数定义 */
// 使用 <canvas> 元素来处理所有非 PNG 图片的压缩。
// 对于 PNG 图片，我们仍然使用 UPNG 库来压缩
// 对于其他格式，我们使用 canvas.toBlob() 方法来创建压缩后的 Blob 对象
export async function compressImageWorker(file: File, initialQuality: number = 0.8): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const base64Prefix = `data:${file.type};base64,`;
        const base64Data = e.target.result as string;
        const originalSizeInBytes = (base64Data.length - base64Prefix.length) * (3 / 4);

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

          let blob: Blob;
          if (file.type === 'image/png') {
            // PNG 图片的压缩逻辑, 为了使用 UPNG，我们需要将 Base64 编码的字符串转换回 ArrayBuffer
            const arrayBuffer = new Uint8Array(atob(base64Data.split(',')[1]));
            const pngData = UPNG.decode(arrayBuffer);
            const compressedPngData = UPNG.encode(pngData, {
              colorType: 6,
              filter: 0,
              compressionLevel: 2
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
              }, file.type, initialQuality);
            });
          }

          Promise.resolve(blob).then((result) => {
            const unit = 1000;
            console.log(`Original size: ${originalSizeInBytes / unit} kb`);
            console.log(`Compressed size: ${result.size / unit} kb`);
            // 如果压缩后的文件大于或等于原始文件，且质量大于 0.1，则继续递归压缩
            if (result.size >= originalSizeInBytes && initialQuality > 0.1) {
              resolve(file);
              // console.log('Compressed image is not smaller, attempting further compression.');
              // compressImageWorker(file, initialQuality - 0.1).then(newBlob => resolve(newBlob));
            } else {
              resolve(transfer(result, [result]));
            }
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
