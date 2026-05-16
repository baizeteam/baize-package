# baize-compress-image

这是一个支持 jpg、jpeg、png、webp、svg 等图片进行压缩的库，它通过 web worker、离屏 canvas 等方式对图片进行压缩，加快压缩的效率。
并且支持多 worker 批量压缩多个图片，不会影响主线程的渲染，有效提升用户体验。

## 开始

### 安装

```
pnpm install baize-compress-image
```

### 使用

插件按需引入，每个插件可独立配置压缩参数：

```typescript
import { ImageCompressor } from "baize-compress-image";
import { jpegWebp } from "baize-compress-image/plugins/jpeg-webp";
import { png } from "baize-compress-image/plugins/png";
import { svg } from "baize-compress-image/plugins/svg";

const compressor = new ImageCompressor({
  workerNum: 8,
  plugins: [
    jpegWebp({ quality: 0.75 }),
    png({ quality: 0.8 }),
    svg({ floatPrecision: 8, svgoPlugins: ["preset-default", "removeDimensions"] }),
  ],
});

const compressionResults = await compressor.compressImagesWorker(files);

compressionResults.forEach((result, index) => {
  if (result.status === "fulfilled") {
    const { compressInfo, file } = result.value;
    console.log(`图片 ${index + 1}:`);
    console.log(`  压缩率: ${compressInfo.rate}%`);
    console.log(`  压缩耗时: ${compressInfo.time}ms`);
    console.log(`  原始大小: ${compressInfo.originalSize} bytes`);
    console.log(`  压缩后大小: ${compressInfo.compressedSize} bytes`);
    console.log(`  压缩后文件:`, file);
  } else {
    console.error(`图片 ${index + 1} 压缩失败:`, result.reason);
  }
});
```

## 插件

### jpegWebp

处理 `image/jpeg` 和 `image/webp` 格式，使用 OffscreenCanvas 压缩。

```typescript
import { jpegWebp } from "baize-compress-image/plugins/jpeg-webp";

// 使用默认配置
jpegWebp();

// 自定义 quality（0-1，默认 0.75）
jpegWebp({ quality: 0.75 });
```

### png

处理 `image/png` 格式，使用 upng-js 压缩。

```typescript
import { png } from "baize-compress-image/plugins/png";

// 使用默认配置
png();

// 自定义 quality（0-1，映射为调色板颜色数，默认 0.8）
png({ quality: 0.6 });
```

### svg

处理 `image/svg+xml` 格式，使用 svgo 压缩。

```typescript
import { svg } from "baize-compress-image/plugins/svg";

// 使用默认配置
svg();

// 自定义 SVGO 参数
svg({
  floatPrecision: 6, // 浮点数精度，默认 8
  svgoPlugins: ["preset-default", "removeDimensions"], // SVGO 插件列表
});
```

## API

### ImageCompressor

```typescript
new ImageCompressor(options: ImageCompressorOptions)
```

| 参数        | 类型               | 说明                               |
| ----------- | ------------------ | ---------------------------------- |
| `workerNum` | `number`           | 每个插件的最大 worker 数量，默认 4 |
| `plugins`   | `CompressPlugin[]` | 插件列表（必填）                   |

### ImageCompressor.compressImagesWorker

```typescript
compressImagesWorker(files: File[]): Promise<PromiseSettledResult<CompressBackInfo>[]>
```

### CompressBackInfo

| 字段                          | 类型     | 说明                   |
| ----------------------------- | -------- | ---------------------- |
| `compressInfo.rate`           | `number` | 压缩率百分比           |
| `compressInfo.time`           | `number` | 压缩耗时（毫秒）       |
| `compressInfo.originalSize`   | `number` | 原始文件大小（字节）   |
| `compressInfo.compressedSize` | `number` | 压缩后文件大小（字节） |
| `file`                        | `File`   | 压缩后的文件对象       |
