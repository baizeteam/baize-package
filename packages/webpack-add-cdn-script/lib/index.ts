import path from "path";
import { Compilation, Compiler, sources } from "webpack";
import { IOptions } from "./types";
import { libName } from "./config";
import { getExternalScript, normalizePath } from "cdn-script-core";
import * as glob from "glob";
import fs from "node:fs";

let mainJsNames: string[] = [];
class WebpackAddCdnScript {
  constructor(private options: IOptions) {}

  apply(compiler: Compiler) {
    const { customScript = {}, defaultCdns = ["jsdelivr", "unpkg"] } = this.options;
    compiler.hooks.thisCompilation.tap(libName, (compilation: Compilation) => {
      compilation.hooks.processAssets.tapAsync(
        {
          name: libName,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        async (assets, callback) => {
          try {
            const external = compiler.options.externals;
            const script = await getExternalScript({
              libName,
              customScript,
              external,
              defaultCdns,
            });
            if (!script) {
              callback();
              return;
            }

            for (const assetName in assets) {
              if (path.extname(assetName) === ".html") {
                let source = assets[assetName].source().toString();
                // 获取打包结果中的本地的js名字
                const inHtmlJsName = source.match(/(?<=<script.*src=(["|']))(?=[./])(.*?)\1/g);
                if (inHtmlJsName) {
                  mainJsNames.push(...inHtmlJsName.map((item) => item.slice(0, -1)));
                }
                source = source.replace("</head>", `${script}</head>`);
                assets[assetName] = new sources.RawSource(source, true);
              }
            }

            callback();
          } catch (error) {
            console.error("webpack-add-cdn-script error:", (error as Error).message);
            process.exit(1);
          }
        },
      );
    });

    compiler.hooks.afterEmit.tapPromise(`${libName} upload`, async (compilation) => {
      if (!compiler.options.output.path) return;
      const outDirPath = path.resolve(normalizePath(compiler.options.output.path));
      const files = glob.sync(outDirPath + "/**/*", {
        nodir: true,
        dot: true,
        ignore: "**/*.html",
      });
      const upLoadRes = await Promise.all(
        files.map(async (file) => ({
          ossPath: await this.options.uploadFiles!(file, {}),
          fileName: file.slice(outDirPath.length + 1),
        })),
      );
      // 替换本地文件名
      const htmlFilePath = glob.sync(outDirPath + "**/*.html", {
        nodir: true,
        dot: true,
      });
      if (htmlFilePath.length === 0) return;
      const htmlFile = htmlFilePath[0];
      let html = fs.readFileSync(htmlFile, "utf-8");
      for (const mainJsName of mainJsNames) {
        const find = upLoadRes.find((item) => mainJsName.includes(item.fileName));
        if (!find) continue;
        html = html.replace(mainJsName, find.ossPath);
      }
      fs.writeFileSync(htmlFile, html);
    });
  }
}

export default WebpackAddCdnScript;
