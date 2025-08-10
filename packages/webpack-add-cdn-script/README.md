# webpack-add-cdn-script

这是一个在 webpack 中使用公共 cdn 的库，包括了 unpkg, jsdelivr 等多个 cdn 资源，如加载失败会自动切换下一个 cdn 进行加载。

## 开始

### 安装

```
pnpm install webpack-add-cdn-script -D
```

### 使用

webpack.config.js

```js
const webpackAddCdnScript = require("webpack-add-cdn-script");

// 需要使用cdn库，按顺序添加，如react-router-dom需要依赖react、@remix-run/router、react-router，因此需要放在最后
const externals = {
  react: "React",
  "react-dom": "ReactDOM",
  "@remix-run/router": "@remix-run/router",
  "react-router": "react-router",
  "react-router-dom": "ReactRouterDOM",
};

module.exports = {
  // 其他配置省略
  externals: externals,
  plugins: [new webpackAddCdnScript({})],
};
```

使用自定义的 cdn

```js
const webpackAddCdnScript = require("webpack-add-cdn-script");

// 需要使用cdn的模块，会按顺序插入脚本，如
const externals = {
  react: "React",
  "react-dom": "ReactDOM",
};

module.exports = {
  // 其他配置省略
  externals: externals,
  plugins: [
    new webpackAddCdnScript({
      customScript: {
        react: "<script src='https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js'></script>",
        "react-dom":
          "<script src='https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.production.min.js'></script>",
      },
    }),
  ],
};
```

options

| 参数         | 解析                       | 类型                                            | 默认值                |
| ------------ | -------------------------- | ----------------------------------------------- | --------------------- |
| customScript | 自定义 cdn 脚本            | { [*key*: string]: string }                     | 无                    |
| defaultCdns  | 默认使用 cdn 的顺序        | string[]                                        | ["jsdelivr", "unpkg"] |
| uploadFiles  | 上传 oss 的函数            | (filePath: string) => string \| Promise<string> |                       |
| uploadIgnore | 忽略文件类型 glob 匹配模式 | string                                          | "\*_/_.html"          |

## 注意事项

- 接入了各大 cdn 的 api 接口进行请求，默认会保存一份 cdn 的缓存在你的根目录中`.cdn-cache.json`。如果发现缓存的资源有问题可以删除该文件，然后重新执行打包流程。
- 按顺序添加 cdn，如 react-router-dom 需要依赖 react、@remix-run/router、react-router，因此需要放在最后。
