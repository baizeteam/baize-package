# baize-compress-image

对图片进行压缩的工具，它通过 web worker、离屏 canvas 等方式对图片进行压缩，加快压缩的效率。
并且支持多worker批量压缩多个图片，不会影响主线程的渲染，有效提升用户体验。

## 开始

### 安装

```
pnpm install baize-compress-image
```

### 使用

在react中

```typescript
import ReactDOM from "react-dom/client";
import { compressImagesWorker } from "baize-compress-image";

function App() {

  const handleMultipleFileChange = async (e: any) => {
    const files = Array.from(e.target.files);
    const res = await compressImagesWorker(file);
    console.log(res);
  };

  return (
    <div>
        <input type="file" multiple onChange={handleMultipleFileChange} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);

```

