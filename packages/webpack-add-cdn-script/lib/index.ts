import path from "path";
import fs from "fs";
import { Compilation, Compiler, sources } from "webpack";
import { IOptions } from "./types";
import { libName } from "./config";
import { ConsoleManage, findUrls, generateScript, getPackageDependencies } from "cdn-script-core";
import { isObject, isStr } from "./utils/tools";

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
          const consoleManage: ConsoleManage = new ConsoleManage(libName);
          const packageJsonPath = path.resolve(process.cwd(), "package.json");

          try {
            const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
            const packageData = JSON.parse(packageJson);

            const inputExternal = compiler.options.externals;
            if (!inputExternal) {
              return callback();
            }
            let external: string[] = [];
            if (isStr(inputExternal)) {
              external = [inputExternal];
            } else if (Array.isArray(inputExternal)) {
              external = inputExternal.filter((item) => typeof item === "string") as string[];
            } else if (isObject(inputExternal)) {
              external = Object.keys(inputExternal);
            }
            if (external.length === 0) {
              callback();
              return;
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
            for (const assetName in assets) {
              if (path.extname(assetName) === ".html") {
                let source = assets[assetName].source().toString();
                source = source.replace("</head>", `${script}</head>`);
                assets[assetName] = new sources.RawSource(source);
              }
            }

            callback();
          } catch (error) {
            consoleManage.consoleAll();
            console.error("webpack-add-cdn-script error:", (error as Error).message);
            process.exit(1);
          }
        },
      );
    });
  }
}

export default WebpackAddCdnScript;
