# baize-compress-image

对图片进行压缩的工具，它通过 web worker、离屏 canvas 等方式对图片进行压缩，加快压缩的效率，并且不会影响主线程的渲染，有效提升用户体验。

## 开始

### 安装

```
pnpm install baize-compress-image
```

### 使用

在react中

```typescript
import ReactDOM from "react-dom/client";
import { compressImageWorker } from "baize-compress-image";

function App() {

  const handleFileChange = async (e: any) => {
    const file = e.target.files[0];
    const res = await compressImageWorker(file);
    console.log(res);
  };
  return (
    <div>
        <input type="file" onChange={handleFileChange} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);

```

