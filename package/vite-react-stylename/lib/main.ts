// ts-check
import { transformSync } from "@babel/core";
import babelPluginReactCssModules from "babel-plugin-react-css-modules";
import babelPluginModuleResolver from "babel-plugin-module-resolver";

enum EEnforce {
  PRE = "pre",
  POST = "post",
}

function viteReactStyleName(opt) {
  const { ...options } = opt;
  let _alias;
  return {
    name: "vite-react-stylename",
    enforce: EEnforce.PRE,
    config(confing) {
      _alias = confing.resolve.alias;
    },
    transform(code, id) {
      // 排除不处理的文件
      if (!/\.(t|j)sx?$/.test(id) || id.includes("node_modules")) {
        return null;
      }
      if (!id.endsWith("x") && !code.includes("react")) {
        return null;
      }
      // 需要使用的解析插件
      const parserPlugins = ["jsx", "importMeta"];
      if (/\.tsx?$/.test(id)) {
        parserPlugins.push("typescript", "decorators-legacy");
      }
      const isReasonReact = id.endsWith(".bs.js");

      const result = transformSync(code, {
        babelrc: false,
        configFile: false,
        filename: id,
        parserOpts: {
          sourceType: "module",
          allowAwaitOutsideFunction: true,
          plugins: parserPlugins,
        },
        plugins: [
          [
            babelPluginModuleResolver,
            {
              alias: _alias,
              extensions: [".js", ".jsx", ".tsx", ".ts"],
            },
          ],
          [
            babelPluginReactCssModules,
            {
              autoResolveMultipleImports: true,
              exclude: "node_modules",
              ...options,
            },
          ],
        ],
        ast: !isReasonReact,
        sourceMaps: true,
        sourceFileName: id,
      });
      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}
export default viteReactStyleName;
