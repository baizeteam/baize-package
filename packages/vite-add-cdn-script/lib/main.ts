import path from "path";
import fs from "fs";
import { PluginOption, UserConfig } from "vite";
import {
  composeVersionObj,
  getCdnCacheInstance,
  getPackageJsonByUrl,
  getPackageURL,
  getPackageVersion,
  ConsoleManage,
  CacheCellType,
  CdnErrorType,
  successCacheCellType,
  failCacheCellType,
} from "./utils";
import { PropertyCdn } from "./types";
import { NetworkError, NoVersionError, PackageNetworkError } from "./utils/ErrorTypes";

enum EEnforce {
  PRE = "pre",
  POST = "post",
}

export interface IOptions {
  customScript?: { [key: string]: string };
  retryTimes?: number;
  defaultCdns?: PropertyCdn[];
}
export const libName = "vite-add-cdn-script";

// 打印控制器
let consoleManage: ConsoleManage;
/**
 *  获取cdn地址
 */
async function findUrls({
  external,
  packageData,
  customScript,
  defaultCdns,
}: {
  external: string[];
  packageData: {
    devDependencies?: Record<string, string>;
    dependencies: Record<string, string>;
  };
  customScript: { [key: string]: string };
  defaultCdns: PropertyCdn[];
}) {
  let noVersionPackages = [] as string[];
  let isUpdateCdnCache = false;
  const cdnCache = await getCdnCacheInstance();
  return await Promise.all<
    | {
        urls: string[];
        key: string;
      }
    | undefined
  >(
    external.map(async (key) => {
      const version = getPackageVersion(packageData, key);

      if (customScript[key]) {
        return {
          urls: [],
          key,
        };
      }
      if (!version) {
        noVersionPackages.push(key);
        return {
          urls: [],
          key,
        };
      }
      const cacheUrls = cdnCache.getCdnCache(key, version);

      if (cacheUrls) {
        // 命中cdn缓存
        const cloneDefaultCdns = new Set(defaultCdns);
        const networkCdnMap = new Map<PropertyCdn, number>();
        const urls = cacheUrls
          .filter((item, index) => {
            if (cloneDefaultCdns.has(item.cdnName) && item.success) {
              cloneDefaultCdns.delete(item.cdnName);
              return true;
            } else if (!item.success && item.error === CdnErrorType.noFound) {
              cloneDefaultCdns.delete(item.cdnName);
            } else {
              networkCdnMap.set(item.cdnName, index);
            }
          })
          .map((item) => (item as successCacheCellType).url);
        if (cloneDefaultCdns.size > 0) {
          const noMatchCdnRes = await Promise.allSettled<CacheCellType>(
            [...cloneDefaultCdns].map(async (cdnName: PropertyCdn) => {
              return {
                cdnName,
                success: true,
                url: await getPackageURL(key, version, cdnName),
              };
            }),
          ).then((data) => {
            return data.filter((item) => {
              if (item.status === "fulfilled") {
                urls.push((item.value as successCacheCellType).url);
                return true;
              } else {
                consoleManage.warn(item.reason.toString());
              }
            }) as PromiseFulfilledResult<CacheCellType>[];
          });
          if (noMatchCdnRes.length > 0) {
            noMatchCdnRes.forEach((item) => {
              const index = networkCdnMap.get(item.value.cdnName);
              if (index !== undefined) {
                cacheUrls[index] = item.value;
              } else {
                cacheUrls.push(item.value);
              }
            });

            isUpdateCdnCache = true;
          }
        }
        return {
          urls,
          key,
        };
      } else {
        // 未命中cdn缓存
        isUpdateCdnCache = true;
        console.log(`从网络获取${key}${version}的cdn地址`);
        const packUrlRes = await Promise.allSettled<CacheCellType>(
          defaultCdns.map(async (cdnName: PropertyCdn) => {
            return {
              cdnName,
              success: true,
              url: await getPackageURL(key, version, cdnName),
            };
          }),
        ).then((data) => {
          return data
            .map((item) => {
              if (item.status === "fulfilled") {
                return item.value;
              } else {
                consoleManage.warn(item.reason.toString());
                if (item.reason instanceof PackageNetworkError || item.reason instanceof NoVersionError) {
                  return {
                    cdnName: item.reason.cdn,
                    success: false,
                    error:
                      item.reason instanceof PackageNetworkError ? CdnErrorType.NetworkError : CdnErrorType.noFound,
                  } satisfies failCacheCellType;
                }
              }
            })
            .filter((e) => !!e);
        });
        if (packUrlRes.length === 0) {
          throw new Error(`获取${key} ${version}的cdn地址失败`);
        }
        const res = {
          urls: packUrlRes.filter((item) => item.success).map((item) => item.url),
          key,
        };
        cdnCache.setCdnCache(key, version, packUrlRes);
        return res;
      }
    }),
  ).then((res) => {
    if (isUpdateCdnCache) {
      cdnCache.save();
    }
    return {
      urls: res,
      noVersionPackages,
    };
  });
}

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
      consoleManage = new ConsoleManage();
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

        const packNameUrl: { [k in string]?: string[] } = {};

        let script = "";
        const { urls: urlListRes, noVersionPackages } = await findUrls({
          external,
          packageData,
          customScript,
          defaultCdns,
        });
        // 没有找到本地版本的库，在库中寻找对应的版本
        if (noVersionPackages.length > 0) {
          const urlPackageJsonRes: {
            dependencies: {
              [key: string]: string;
            };
          } = { dependencies: {} };
          await Promise.allSettled(
            urlListRes.map(async (item) => {
              if (!item) return;
              const { key, urls } = item;
              // 因为对应版本的package.json是相同的且都是从cdn获取的，所以只需要获取一个即可
              const findPackageJsonUrl = customScript[key] || urls[0];
              if (!findPackageJsonUrl) return;
              const packageJson = await getPackageJsonByUrl(findPackageJsonUrl);
              composeVersionObj(urlPackageJsonRes.dependencies, packageJson.dependencies);
            }),
          ).then((data) => {
            data.forEach((item) => {
              if (item.status === "rejected") {
                consoleManage.warn(item.reason.toString());
              }
            });
          });
          const { urls: noPackageUrls, noVersionPackages: notFindPackages } = await findUrls({
            external: noVersionPackages,
            packageData: urlPackageJsonRes,
            customScript,
            defaultCdns,
          });
          // 合并未找到版本的库的cdn地址列表（保持原有顺序）
          noPackageUrls.map((item) => {
            if (!item) return;
            const { urls, key } = item;
            urlListRes.find((item) => item?.key === key)?.urls.push(...urls);
          });
          // urlListRes.push(...noPackageUrls);
          if (notFindPackages.length > 0) {
            console.error(`找不到${notFindPackages.join(",")}的版本`);
            throw new Error(`找不到${notFindPackages.join(",")}的版本`);
          }
        }

        consoleManage.consoleAll();

        urlListRes.forEach((element) => {
          if (!element) return;
          const { urls, key } = element;
          if (customScript[key]) {
            script += customScript[key];
          } else {
            packNameUrl[key] = urls;
            const url = urls[0];
            script += `<script src="${url}" type="text/javascript" crossorigin="anonymous" onerror="errorCDN(this)" data-cur="0"  data-key="${key}"></script>\n`;
          }
        });
        const errorScript = `<script>
        function errorCDN(e) {
          const packNameUrl = JSON.parse('${JSON.stringify(packNameUrl)}');
          const nextCur = parseInt(e.getAttribute("data-cur")) + 1;
          
          const key = e.getAttribute("data-key");
          const curPackNameUrl = packNameUrl[key]
          if(nextCur>=curPackNameUrl.length){return;}
          // 新的cdn链接
          const url = curPackNameUrl[nextCur]
          // 克隆原标签
          const tagName = e.tagName
          const cdnDOM = document.createElement(tagName);
          cdnDOM.setAttribute(tagName === 'SCRIPT' ?'src' : 'href', url);
          Object.keys(e.dataset).forEach(_key => {
            cdnDOM.setAttribute('data-'+_key, e.dataset[_key]);
          })
          cdnDOM.setAttribute("data-cur", nextCur.toString());
          cdnDOM.setAttribute("onerror", "errorCDN(this)");
          document.head.appendChild(cdnDOM);
          e.remove();
        }
      </script>`;
        script = errorScript + script;
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
