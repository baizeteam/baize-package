# vite-add-cdn-script

这是一个在vite.js中使用公共cdn的库，包括了"bootcdn", "bytedance", "unpkg", "cdnjs", "jsdelivr", "staticfile"等多个cdn资源，如加载失败会自动切换下一个cdn进行加载。

## 开始

### 安装

```
pnpm install vite-add-cdn-script rollup-plugin-external-globals -D
```

### 使用

vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteAddCdnScript from "../vite-add-cdn-script/lib/main";
import externalGlobals from "rollup-plugin-external-globals";

// 需要使用cdn库
const externals = {
  react: "React",
  "react-dom": "ReactDOM",
};

export default defineConfig({
  plugins: [
    react(),
    viteAddCdnScript({}),
  ],
  build: {
    rollupOptions: {
      external: [...Object.keys(externals)],
      plugins: [externalGlobals(externals)],
    },
  },
});
```



使用自定义的cdn

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteAddCdnScript from "../vite-add-cdn-script/lib/main";
import externalGlobals from "rollup-plugin-external-globals";

const externals = {
  react: "React",
  "react-dom": "ReactDOM",
};

export default defineConfig({
  plugins: [
    react(),
    viteAddCdnScript({
      customScript: {
        react: "<script src='https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js'></script>",
        "react-dom": "<script src='https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.production.min.js'></script>",
      },
    }),
  ],
  base: "./",
  build: {
    rollupOptions: {
      external: [...Object.keys(externals)],
      plugins: [externalGlobals(externals)],
    },
  },
});

```



options

| 参数         | 解析              | 类型                        | 默认值                                                       |
| ------------ | ----------------- | --------------------------- | ------------------------------------------------------------ |
| protocol     | 协议              | “http”\|“https”             | https                                                        |
| customScript | 自定义cdn脚本     | { [*key*: string]: string } | 无                                                           |
| retryTimes   | 重试次数          | number                      | 3                                                            |
| defaultCdns  | 默认使用cdn的顺序 | string[]                    | ["bootcdn", "bytedance", "unpkg", "cdnjs", "jsdelivr", "staticfile"] |



## 注意事项

因为cdn对包管理的命名有很大的不同，默认是使用了xxx.min.js的文件，如果您使用的库的cdn文件不是这个的话，则需要配置为自定义的cdn。

目前做了适配的非xxx.min.js适配的库如下，如果你有合适的cdn源或者，需要适配的库，欢迎提交issue或者pr！！！

```
{
  react: "umd/react.production.min.js",
  "react-dom": "umd/react-dom.production.min.js",
  "react-router-dom": "react-router-dom.production.min.js",
  mobx: "mobx.umd.production.min.js",
  "mobx-react": "mobxreact.umd.production.min.js",
  vue: "vue.global.min.js",
  "vue-router": "vue-router.global.prod.min.js",
}
```

