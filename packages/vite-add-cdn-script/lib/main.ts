import path from "path";
import fs from "fs";
import { PluginOption, UserConfig } from "vite";
import { EEnforce, IOptions } from "./types";
import { libName } from "./config";
import { ConsoleManage, findUrls, generateScript, getPackageDependencies } from "cdn-script-core";

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
      let consoleManage: ConsoleManage = new ConsoleManage(libName);
      const packageJsonPath = path.resolve(process.cwd(), "package.json");
      try {
        const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
        const packageData = JSON.parse(packageJson);
        const inputExternal = _config.build?.rollupOptions?.external;
        if (!inputExternal) {
          return html;
        }
        let external: string[] = [];
        if (typeof inputExternal === "string") {
          external = [inputExternal];
        } else if (Array.isArray(inputExternal)) {
          external = inputExternal.filter((item) => typeof item === "string") as string[];
        } else if (typeof inputExternal === "object") {
          return html;
        }

        const {
          urls: urlListRes,
          noVersionPackages,
          errorList,
        } = await findUrls({
          external,
          packageData,
          customScript,
          defaultCdns,
        });
        consoleManage.addMessageList("warn", errorList);
        // 没有找到本地版本的库，在库中寻找对应的版本
        if (noVersionPackages.length > 0) {
          const { urlPackageJsonRes, errorList: packageDependErrorList } = await getPackageDependencies({
            packageVersionInfo: urlListRes,
          });
          consoleManage.addMessageList("warn", packageDependErrorList);
          const {
            urls: noPackageUrls,
            noVersionPackages: notFindPackages,
            errorList,
          } = await findUrls({
            external: noVersionPackages,
            packageData: urlPackageJsonRes,
            customScript,
            defaultCdns,
          });
          consoleManage.addMessageList("warn", errorList);
          // 合并未找到版本的库的cdn地址列表（保持原有顺序）
          noPackageUrls.map((item) => {
            if (!item) return;
            const { urls, key } = item;
            urlListRes.find((item) => item?.key === key)?.urls.push(...urls);
          });

          if (notFindPackages.length > 0) {
            console.error(`找不到${notFindPackages.join(",")}的版本`);
            throw new Error(`找不到${notFindPackages.join(",")}的版本`);
          }
        }

        consoleManage.consoleAll();

        const script = generateScript(urlListRes);
        html = html.replace("</head>", `${script}</head>`);

        return html;
      } catch (error) {
        consoleManage.consoleAll();
        console.error("vite-add-cdn-script error:", (error as Error).message);
        process.exit(1);
      }
    },
  };
}
export default viteAddCdnScript;
