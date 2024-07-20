import { PluginOption, UserConfig } from "vite";
import { EEnforce, IOptions } from "./types";
import { libName } from "./config";
import { getExternalScript } from "cdn-script-core";

function viteAddCdnScript(opt: IOptions): PluginOption {
  const { customScript = {}, defaultCdns = ["jsdelivr", "unpkg"] } = opt;
  let _config: UserConfig;

  return {
    name: libName,
    enforce: EEnforce.PRE,
    apply: "build",
    config(confing) {
      _config = confing;
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
