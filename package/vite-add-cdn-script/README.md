# vite-add-cdn-script

这是一个在 vite.js 中使用公共 cdn 的库，包括了 unpkg, jsdelivr 等多个 cdn 资源，如加载失败会自动切换下一个 cdn 进行加载。

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
import viteAddCdnScript from "vite-add-cdn-script";
import externalGlobals from "rollup-plugin-external-globals";

// 需要使用cdn库，按顺序添加，如react-router-dom需要依赖react、@remix-run/router、react-router，因此需要放在最后
const externals = {
  react: "React",
  "react-dom": "ReactDOM",
  "@remix-run/router": "@remix-run/router",
  "react-router": "react-router",
  "react-router-dom": "ReactRouterDOM",
};

export default defineConfig({
  plugins: [react(), viteAddCdnScript({})],
  build: {
    rollupOptions: {
      external: [...Object.keys(externals)],
      plugins: [externalGlobals(externals)],
    },
  },
});
```

使用自定义的 cdn

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteAddCdnScript from "../vite-add-cdn-script/lib/main";
import externalGlobals from "rollup-plugin-external-globals";

// 需要使用cdn的模块，会按顺序插入脚本，如
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
        "react-dom":
          "<script src='https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.production.min.js'></script>",
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

| 参数         | 解析                | 类型                        | 默认值                |
| ------------ | ------------------- | --------------------------- | --------------------- |
| protocol     | 协议                | “http”\|“https”             | https                 |
| customScript | 自定义 cdn 脚本     | { [*key*: string]: string } | 无                    |
| custom       | 自定义 cdn 脚本     | { [*key*: string]: string } | 无                    |
| retryTimes   | 重试次数            | number                      | 3                     |
| defaultCdns  | 默认使用 cdn 的顺序 | string[]                    | ["jsdelivr", "unpkg"] |



## 代办

- [ ] 适配vue相关基础库
- [ ] 适配常用的工具类
- [ ] 兼容bootcdn
- [ ] 兼容cdnjs



## 注意事项

因为 cdn 对包管理的命名有很大的不同，默认是使用了 dist/xxx.min.js 的文件，如果您使用的库的 cdn 文件不是这个的话，则需要配置为自定义的 cdn。

目前做了适配的非 xxx.min.js 适配的库如下，如果你有合适的 cdn 源或者，需要适配的库，欢迎提交 issue 或者 pr！！！

```
{
  // react
  react: "umd/react.production.min.js",
  "react-dom": "umd/react-dom.production.min.js",
  "@remix-run/router": "dist/router.umd.min.js",
  "react-router": "dist/umd/react-router.production.min.js",
  "react-router-dom": "dist/umd/react-router-dom.production.min.js",
  mobx: "dist/mobx.umd.production.min.js",
  "mobx-react": "dist/mobxreact.umd.production.min.js",

  // vue
  vue: "dist/vue.global.prod.min.js",
  "vue-router": "dist/vue-router.global.prod.min.js",
  "vue-demi": "lib/index.iife.min.js",
  pinia: "dist/pinia.iife.min.js",

  // tool
  dayjs: "dayjs.min.js",
  moment: "moment.min.js",
  lodash: "lodash.min.js",
}
```
