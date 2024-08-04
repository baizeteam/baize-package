import { BuildOptions, PluginOption, UserConfig } from "vite";
import { EEnforce, IOptions } from "./types";
import { libName } from "./config";
import { getExternalScript, normalizePath } from "cdn-script-core";
import * as glob from "glob";
import fs from "node:fs";
import path from "node:path";
function viteAddCdnScript(opt: IOptions): PluginOption {
  const { customScript = {}, defaultCdns = ["jsdelivr", "unpkg"] } = opt;
  let _config: UserConfig;
  let buildConfig: BuildOptions | undefined = undefined;

  let mainJsNames: string[] = [];
  return {
    name: libName,
    enforce: EEnforce.PRE,
    apply: "build",
    config(config) {
      _config = config;
      buildConfig = config.build;
    },
    closeBundle: {
      sequential: true,
      order: "post",
      async handler() {
        try {
          if (!buildConfig || !opt.uploadFiles || !buildConfig.outDir || !mainJsNames.length) return;

          const outDirPath = normalizePath(path.resolve(normalizePath(buildConfig.outDir)));

          const files = glob.sync(outDirPath + "/**/*", {
            nodir: true,
            dot: true,
            ignore: opt.uploadIgnore || "**/*.html",
          });

          const upLoadRes = await Promise.all(
            files.map(async (file) => ({
              ossPath: await opt.uploadFiles!(file, {}),
              fileName: file.slice(outDirPath.length + 1),
            })),
          );
          // 替换本地文件名
          const htmlFilePath = glob.sync(outDirPath + "**/*.html", {
            nodir: true,
            dot: true,
          });
          if (htmlFilePath.length === 0) return;
          for (const htmlFile of htmlFilePath) {
            if (files.includes(htmlFile)) {
              continue;
            }
            let html = fs.readFileSync(htmlFile, "utf-8");
            for (const mainJsName of mainJsNames) {
              const find = upLoadRes.find((item) => mainJsName.includes(item.fileName));
              if (!find) continue;
              html = html.replace(mainJsName, find.ossPath);
            }
            fs.writeFileSync(htmlFile, html);
          }
        } catch (error) {
          console.error(`${libName} error:`, (error as Error).message);
          process.exit(1);
        }
      },
    },
    async transformIndexHtml(html) {
      if (!defaultCdns || defaultCdns.length === 0) throw new Error("defaultCdns不能为空");
      // 获取打包结果中的本地的js名字
      const inHtmlJsName = html.match(/(?<=<script.*src=(["|']))(?=[./])(.*?)\1/g);
      if (inHtmlJsName) {
        mainJsNames.push(...inHtmlJsName.map((item) => item.slice(0, -1)));
      }
      // 打印控制器
      const external = _config.build?.rollupOptions?.external;
      if (!external) return html;
      try {
        const script = await getExternalScript({
          libName,
          customScript,
          external,
          defaultCdns,
        });
        html = html.replace("</head>", `${script}</head>`);

        return html;
      } catch (error) {
        console.error("vite-add-cdn-script error:", (error as Error).message);
        process.exit(1);
      }
    },
  };
}
export default viteAddCdnScript;
