import { BuildOptions, PluginOption, UserConfig } from "vite";
import { EEnforce, IOptions } from "./types";
import { libName } from "./config";
import { getExternalScript, getScriptSrcs, normalizePath, uploadAssetsFiles } from "cdn-script-core";

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
          if (!buildConfig || !opt.uploadFiles || !mainJsNames.length) return;
          const outDirPath = normalizePath(path.resolve(normalizePath(buildConfig.outDir || "dist")));
          uploadAssetsFiles({
            outDirPath,
            uploadFiles: opt.uploadFiles,
            mainJsNames,
            uploadIgnore: opt.uploadIgnore,
          });
        } catch (error) {
          console.error(`${libName} error:`, (error as Error).message);
          process.exit(1);
        }
      },
    },
    async transformIndexHtml(html) {
      if (!defaultCdns || defaultCdns.length === 0) throw new Error("defaultCdns不能为空");
      // 获取打包结果中的本地的js名字
      const inHtmlJsName = getScriptSrcs(html);
      if (inHtmlJsName) {
        mainJsNames.push(...inHtmlJsName);
      }
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
