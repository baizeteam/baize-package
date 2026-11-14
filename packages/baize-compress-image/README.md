# baize-compress-image

这是一个支持 jpg、jpeg、png、webp、svg、gif 等图片进行压缩的库，它通过 web worker、离屏 canvas 等方式对图片进行压缩，加快压缩的效率。
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
import { gif } from "baize-compress-image/plugins/gif";

const compressor = new ImageCompressor({
  workerNum: 8,
  plugins: [
    jpegWebp({ quality: 0.75 }),
    png({ quality: 0.8 }),
    svg({ floatPrecision: 8, svgoPlugins: ["preset-default", "removeDimensions"] }),
    gif({ quality: 0.75, optimize: 1 }),
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

### gif

处理 `image/gif` 格式，使用 [gifsicle-wasm-browser](https://github.com/renzhezhilu/gifsicle-wasm-browser) 压缩。任务走共用的 worker 池，gifsicle 只负责在 worker 内执行压缩。

```typescript
import { gif } from "baize-compress-image/plugins/gif";

// 使用默认配置：quality 0.75（约等于 --lossy=50）、optimize 1（-O1）
gif();

gif({
  quality: 0.75, // 0-1，越大画质越高。未传 lossy 时换算为 --lossy = (1 - quality) * 200
  optimize: 1, // gifsicle -O 等级，1 | 2 | 3，默认 1
  lossy: 40, // 0-200。设置后忽略 quality 换算；0 表示不做有损压缩
});
```

大图建议保持 `optimize: 1`。`-O2` / `-O3` 耗时会明显增加，压缩效果通常接近 `-O1`。单次任务超过 30 秒会超时。

## Worker 加载与复用

内置插件会自动提供压缩模块地址，业务代码只需调用 `jpegWebp()`、`png()`、`svg()`、`gif()`，无需配置 `moduleUrl`，也无需额外的 Worker loader。

`workerNum` 是一个 `ImageCompressor` 实例下全部插件共用的线程上限，默认 4。线程按任务需要创建，空闲线程可以处理任意插件的任务。例如设置为 1 时，JPEG、PNG、SVG、GIF 交替压缩也只创建一个 Worker。不同实例各自维护线程池。

每个 Worker 首次使用某个压缩模块时才会动态加载，并缓存该模块的压缩函数；后续任务复用线程和模块。压缩代码在 Worker 中执行，不会在主线程加载编解码实现。

单张图片失败不会影响后续任务。线程崩溃或任务超过 30 秒时会终止该线程，后续任务按需创建替代线程。`cancelAll()` 会结束正在读取、排队和执行的任务并释放线程，之后仍可使用同一个实例提交新的任务。

## 自定义插件

插件负责匹配文件类型、提供独立压缩模块的地址和默认参数，无需创建 Worker。多个插件都能匹配同一个类型时，使用先注册的那个。

将压缩逻辑放在独立的浏览器 ESM 文件中，导出 `compress`。模块里的依赖也需要预先打包，不能依赖页面环境或主线程闭包。例如 `my-format.compress.js`：

```javascript
// 这里演示模块接口，实际插件应在此调用自己的编码实现。
export async function compress({ arrayBuffer, fileName, fileType }) {
  return { success: true, data: arrayBuffer, fileName, fileType };
}
```

插件入口 `my-format.ts`：

```typescript
import type { CompressPlugin } from "baize-compress-image";

export function myFormat(config?: { quality?: number }): CompressPlugin {
  return {
    name: "my-format",
    matches: (fileType) => fileType === "image/avif",
    moduleUrl: new URL("./my-format.compress.js", import.meta.url).href,
    defaultConfig: { quality: config?.quality ?? 0.8 },
  };
}
```

`new URL` 的路径必须是静态字符串，便于消费端打包器将模块作为资源发布。压缩模块不能导入页面入口或在顶层启动页面。内置插件已经处理这些细节，使用者只需配置压缩参数。

| 字段            | 说明                                                   |
| --------------- | ------------------------------------------------------ |
| `name`          | 插件名称                                               |
| `matches`       | 返回 `true` 的文件会进入这个插件                        |
| `moduleUrl`     | 插件内部的压缩模块入口，模块导出 `compress`             |
| `defaultConfig` | 默认参数，和文件数据一起传给 `compress`                 |

`compress` 收到 `arrayBuffer`、`fileName`、`fileType` 和 `defaultConfig` 中的字段，返回 `{ success: true, data, fileName, fileType }`。`data` 为压缩后的 `ArrayBuffer`；压缩后没有变小时，可返回原始缓冲区。抛错会使这一张图片失败。输入和输出缓冲区通过 transferable 传递，不应在返回结果后继续使用输出缓冲区。

为兼容旧插件，仍支持模块导出 `func` 或导出返回 `{ func }` 的插件工厂；新插件直接导出 `compress` 即可，插件对象无需再携带 `func`。

```typescript
const compressor = new ImageCompressor({
  workerNum: 4,
  plugins: [myFormat(), gif()],
});

await compressor.compressImagesWorker(files);
```

## API

### ImageCompressor

```typescript
new ImageCompressor(options: ImageCompressorOptions)
```

| 参数        | 类型               | 说明                               |
| ----------- | ------------------ | ---------------------------------- |
| `workerNum` | `number`           | 全部插件共用的 worker 数量上限，默认 4 |
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
