import path from "path";
import { Compilation, Compiler, sources } from "webpack";
import { IOptions } from "./types";
import { libName } from "./config";
import { getExternalScript, getScriptSrcs, normalizePath, uploadAssetsFiles } from "cdn-script-core";

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
                const inHtmlJsName = getScriptSrcs(source);
                if (inHtmlJsName) {
                  mainJsNames.push(...inHtmlJsName);
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
      try {
        if (!this.options.uploadFiles || !mainJsNames.length) return;
        const outDirPath = path.resolve(normalizePath(compiler.options.output.path || "dist"));
        uploadAssetsFiles({
          outDirPath,
          uploadFiles: this.options.uploadFiles,
          mainJsNames,
          uploadIgnore: this.options.uploadIgnore,
        });
      } catch (error) {
        console.error(`${libName} error:`, (error as Error).message);
        process.exit(1);
      }
    });
  }
}

export default WebpackAddCdnScript;
