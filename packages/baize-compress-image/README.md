# baize-compress-image

对图片进行压缩的工具，它通过 web worker、离屏 canvas 等方式对图片进行压缩，加快压缩的效率。
并且支持多 worker 批量压缩多个图片，不会影响主线程的渲染，有效提升用户体验。

## 开始

### 安装

```
pnpm install baize-compress-image
```

### 使用

在 react 中

```typescript
import ReactDOM from "react-dom/client";
import { ImageCompressor, CompressBackInfo, CompressOptions } from "baize-compress-image";

function App() {
  const handleMultipleFileChange = async (e: any) => {
    const files = Array.from(e.target.files);

    // 配置压缩选项
    const options: CompressOptions = {
      quality: 0.8, // 压缩质量 (0-1)
    };

    // 通过类创建实例，并在创建时设定 worker 数量，默认为4
    const compressor = new ImageCompressor({
      workerNum: 8,
    });
    const compressionResults = await compressor.compressImagesWorker(originalImages, {
      quality: 0.5,
    });

    results.forEach((result, index) => {
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
  };

  return (
    <div>
      <input type="file" multiple onChange={handleMultipleFileChange} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
```

在 vue 中

```vue
<script setup lang="ts">
import { ImageCompressor, CompressBackInfo, CompressOptions } from "baize-compress-image";

const handleMultipleFileChange = async (e: any) => {
  const files = Array.from(e.target.files) as File[];

  // 配置压缩选项
  const options: CompressOptions = {
    quality: 0.8, // 压缩质量 (0-1)
  };

  // 通过类创建实例，并在创建时设定 worker 数量，默认为4
  const compressor = new ImageCompressor({
    workerNum: 8,
  });
  const compressionResults = await compressor.compressImagesWorker(originalImages, {
    quality: 0.5,
  });

  results.forEach((result, index) => {
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
};
</script>

<template>
  <div>
    <input type="file" multiple @change="handleMultipleFileChange" />
  </div>
</template>
```

## API 说明

### CompressOptions（类方式）

压缩选项配置：

- `quality`: 压缩质量，范围 0-1，默认值 0.8

### CompressBackInfo

压缩结果信息：

- `compressInfo.rate`: 压缩率百分比
- `compressInfo.time`: 压缩耗时（毫秒）
- `compressInfo.originalSize`: 原始文件大小（字节）
- `compressInfo.compressedSize`: 压缩后文件大小（字节）
- `file`: 压缩后的文件对象
