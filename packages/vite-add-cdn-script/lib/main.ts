import { BuildOptions, PluginOption, UserConfig, normalizePath } from "vite";
import { EEnforce, IOptions } from "./types";
import { libName } from "./config";
import { getExternalScript } from "cdn-script-core";
import glob from "glob";

import path from "path";
function viteAddCdnScript(opt: IOptions): PluginOption {
  const { customScript = {}, defaultCdns = ["jsdelivr", "unpkg"] } = opt;
  let _config: UserConfig;
  let buildConfig: BuildOptions | undefined = undefined;
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
        if (!buildConfig || !opt.uploadFiles) return;
        const outDirPath = normalizePath(path.resolve(normalizePath(buildConfig.outDir)));
        const files = glob.sync(outDirPath + "/**/*", {
          nodir: true,
          dot: true,
          ignore: "**/*.html",
        });
        // 上传文件
        for (const file of files) {
          opt.uploadFiles(file, {});
        }
      },
    },
    async transformIndexHtml(html) {
      if (!defaultCdns || defaultCdns.length === 0) throw new Error("defaultCdns不能为空");
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
