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
import { compressImagesWorker, CompressBackInfo } from "baize-compress-image";

function App() {
  const handleMultipleFileChange = async (e: any) => {
    const files = Array.from(e.target.files);
    const results = await compressImagesWorker(files);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const { compressInfo, file } = result.value;
        console.log(`图片 ${index + 1}:`);
        console.log(`  压缩率: ${compressInfo.rate}%`);
        console.log(`  压缩耗时: ${compressInfo.time}ms`);
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
import { compressImagesWorker, CompressBackInfo } from "baize-compress-image";

const handleMultipleFileChange = async (e: any) => {
  const files = Array.from(e.target.files) as File[];
  const results = await compressImagesWorker(files);

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const { compressInfo, file } = result.value;
      console.log(`图片 ${index + 1}:`);
      console.log(`  压缩率: ${compressInfo.rate}%`);
      console.log(`  压缩耗时: ${compressInfo.time}ms`);
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
