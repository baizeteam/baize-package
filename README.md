# vite-react-stylename

A vitejs plugin to use [babel-plugin-react-css-modules](https://www.npmjs.com/package/babel-plugin-react-css-modules)

This project was modified based on the  `vite-plugin-react-css-module`. Due to the lack of adaptation to `alias` in the source project and a long absence of updates, a new project was opened using vite's lib mode.

## getting start



### Installation



```
pnpm install @baizeteam/vite-react-stylename
```

other devDependencies

```
pnpm install less postcss-less generic-names @types/react-css-modules @types/node -D
```



### usage

vite

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteReactStyleName from "@baizeteam/vite-react-stylename";
import genericNames from "generic-names";
import { resolve } from "path";

const generateScopedName = genericNames("[name]__[local]__[hash:base64:4]");

const alias = {
  "@": resolve(__dirname, "src"),
};

export default defineConfig({
  plugins: [
    react(),
    viteReactStyleName({
      generateScopedName,
      filetypes: {
        ".less": {
          syntax: "postcss-less",
        },
      },
      alias,
    }),
  ],
  css: {
    modules: {
      generateScopedName: generateScopedName,
    },
  },
  resolve: {
    alias,
  }
});

```

In React, you can use `xxx.module.less` + `stylename` to enable the ` CSS module`.

```typescript
import ReactDOM from "react-dom/client";
import "./index.module.less";
import "@/assets/index.less";

function App() {
  return <div styleName="app-container">Hello vite-react-stylename!</div>;
}

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
```



### options

you can use all the options exclude `webpackHotModuleReloading` of babel-plugin-react-css-modules.

| Name                         | Type                                   | Description                                                  | Default                                      |
| ---------------------------- | -------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `context`                    | `string`                               | Must match webpack [`context`](https://webpack.js.org/configuration/entry-context/#context) configuration. [`css-loader`](https://github.com/webpack/css-loader) inherits `context` values from webpack. Other CSS module implementations might use different context resolution logic. | `process.cwd()`                              |
| `exclude`                    | `string`                               | A RegExp that will exclude otherwise included files e.g., to exclude all styles from node_modules `exclude: 'node_modules'` |                                              |
| `filetypes`                  | `?FiletypesConfigurationType`          | Configure [postcss syntax loaders](https://github.com/postcss/postcss#syntaxes) like sugarss, LESS and SCSS and extra plugins for them. |                                              |
| `generateScopedName`         | `?GenerateScopedNameConfigurationType` | Refer to [Generating scoped names](https://github.com/css-modules/postcss-modules#generating-scoped-names). If you use this option, make sure it matches the value of `localIdentName` [in webpack config](https://webpack.js.org/loaders/css-loader/#localidentname). See this [issue](https://github.com/gajus/babel-plugin-react-css-modules/issues/108#issuecomment-334351241) | `[path]___[name]__[local]___[hash:base64:5]` |
| `removeImport`               | `boolean`                              | Remove the matching style import. This option is used to enable server-side rendering. | `false`                                      |
| `handleMissingStyleName`     | `"throw"`, `"warn"`, `"ignore"`        | Determines what should be done for undefined CSS modules (using a `styleName` for which there is no CSS module defined). Setting this option to `"ignore"` is equivalent to setting `errorWhenNotFound: false` in [react-css-modules](https://github.com/gajus/react-css-modules#errorwhennotfound). | `"throw"`                                    |
| `attributeNames`             | `?AttributeNameMapType`                | Refer to [Custom Attribute Mapping](https://github.com/fchengjin/vite-plugin-react-css-module/blob/main/readme.md#custom-attribute-mapping) | `{"styleName": "className"}`                 |
| `skip`                       | `boolean`                              | Whether to apply plugin if no matching `attributeNames` found in the file | `false`                                      |
| `autoResolveMultipleImports` | `boolean`                              | Allow multiple anonymous imports if `styleName` is only in one of them. | `false`                                      |

### Special Thanks

https://github.com/fchengjin/vite-plugin-react-css-module