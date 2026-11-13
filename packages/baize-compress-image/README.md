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

每个内置插件都可以传 `moduleUrl`，用来替换 worker 加载压缩模块的地址。不传时使用包内自带的地址。打包器没有改写包内地址、worker 报 `Failed to fetch dynamically imported module` 时，在业务代码里自己填：

```typescript
import { gif } from "baize-compress-image/plugins/gif";

gif({
  moduleUrl: new URL("baize-compress-image/plugins/gif-compress.js", import.meta.url).href,
});
```

对应文件：

| 插件 | 地址 |
| --- | --- |
| `jpegWebp` | `baize-compress-image/plugins/jpeg-webp-compress.js` |
| `png` | `baize-compress-image/plugins/png-compress.js` |
| `svg` | `baize-compress-image/plugins/svg-compress.js` |
| `gif` | `baize-compress-image/plugins/gif-compress.js` |

`new URL` 要写在业务代码里，这样打包器才会把文件发到站点上。也可以填已经部署好的地址，比如 `gif({ moduleUrl: "/vendor/gif-compress.js" })`。

## 自定义插件

`workerNum` 是全部插件共用的线程数。比如设成 4，不管注册了几种格式，都只有 4 个 worker。空闲的会复用，都在忙就排队。插件不用自己开线程，只要匹配文件类型，并用 `func` 指定压缩函数。

多个插件都能匹配同一个类型时，使用先注册的那个。`name` 不要和已注册插件重复。

`func` 写在插件同一个模块里即可，文件名不限。共用 worker 会按 `moduleUrl` 加载这个模块，再调用其中的 `func`。这个文件会被 worker 再执行一次，不要在里面启动页面。

Vite 里 `moduleUrl` 写 `import.meta.url`。Next.js（Turbopack）和 Webpack 会把裸的 `import.meta.url` 变成 `file://` 地址，浏览器里的 worker 拉不到，压缩会报 `Failed to fetch dynamically imported module`。这时要写成 `new URL("./压缩模块.js", import.meta.url).href`，让打包器把该文件发到站点上。这个文件必须是浏览器能直接 `import()` 的 ESM。

```typescript
import type { CompressPayload, CompressPlugin, CompressResult } from "baize-compress-image";

async function compressAvif({
  arrayBuffer,
  fileName,
  fileType,
  quality,
  colors,
}: CompressPayload): Promise<CompressResult> {
  const compressed = await encodeAvif(arrayBuffer, { quality, colors });
  const data = compressed.byteLength < arrayBuffer.byteLength ? compressed : arrayBuffer;
  return { success: true, data, fileName, fileType };
}

async function encodeAvif(buffer: ArrayBuffer, _options: { quality: number; colors: number }) {
  return buffer;
}

export function myFormat(config?: { quality?: number; colors?: number }): CompressPlugin {
  return {
    name: "my-format",
    matches: (fileType) => fileType === "image/avif",
    func: compressAvif,
    moduleUrl: import.meta.url,
    defaultConfig: {
      quality: config?.quality ?? 0.8,
      colors: config?.colors ?? 128,
    },
  };
}
```

| 字段            | 说明                                                          |
| --------------- | ------------------------------------------------------------- |
| `name`          | 插件名称                                                      |
| `matches`       | 返回 `true` 的文件会进这个插件                                |
| `func`          | 压缩函数                                                      |
| `moduleUrl`     | 压缩模块地址。Vite 用 `import.meta.url`；Next/Webpack 用 `new URL("./文件.js", import.meta.url).href` |
| `defaultConfig` | 默认参数，会和文件数据一起传给 `func`                         |

`func` 收到的参数包含 `arrayBuffer`、`fileName`、`fileType`，以及 `defaultConfig` 里的字段。返回 `{ success: true, data, fileName, fileType }`。`data` 是压缩后的 `ArrayBuffer`。压缩后没有变小时，把原始 `arrayBuffer` 原样返回。抛错会当成这一张失败。单次任务超过 30 秒会超时。

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
| `workerNum` | `number`           | 全部插件共用的 worker 数量，默认 4 |
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
