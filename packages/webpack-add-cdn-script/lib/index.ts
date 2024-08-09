import path from "path";
import { Compilation, Compiler, sources } from "webpack";
import { IOptions } from "./types";
import { libName } from "./config";
import {
  getExternalScript,
  getLoadTagAndAttrStr,
  normalizePath,
  uploadAssetsFiles,
  loadTagAndAttrStrType,
} from "cdn-script-core";

let loadTagAndAttrs: loadTagAndAttrStrType[] = [];
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
                const inHtmlLoadTag = getLoadTagAndAttrStr(source);
                if (inHtmlLoadTag) {
                  loadTagAndAttrs.push(...inHtmlLoadTag);
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
        if (!this.options.uploadFiles || !loadTagAndAttrs.length) return;
        const outDirPath = path.resolve(normalizePath(compiler.options.output.path || "dist"));
        uploadAssetsFiles({
          outDirPath,
          uploadFiles: this.options.uploadFiles,
          loadTagAndAttrs,
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
