import path from "path";
import fs from "fs";
import { PluginOption } from "vite";
import { composeVersionObj, getCdnCacheInstance, getPackageJsonByUrl, getPackageURL, getPackageVersion } from "./utils";
import { PropertyCdn } from "./types";

enum EEnforce {
  PRE = "pre",
  POST = "post",
}

export interface IOptions {
  customScript?: { [key: string]: string };
  retryTimes?: number;
  defaultCdns?: PropertyCdn[];
}

/**
 *  获取cdn地址
 */
async function findUrls({ external, packageData, customScript, defaultCdns }) {
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
        return;
      }
      const cacheUrls = cdnCache.getCdnCache(key, version);
      if (cacheUrls) {
        // 命中cdn缓存
        return {
          urls: cacheUrls,
          key,
        };
      } else {
        // 未命中cdn缓存
        isUpdateCdnCache = true;
        const res = {
          urls: await Promise.all(
            defaultCdns.map(async (cdn) => {
              return await getPackageURL(key, version, cdn);
            }),
          ),
          key,
        };
        cdnCache.setCdnCache(key, version, res.urls);
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
  const { customScript = {}, retryTimes = 1, defaultCdns = ["jsdelivr", "unpkg"] } = opt;
  let _config;

  return {
    name: "vite-add-cdn-script",
    enforce: EEnforce.PRE,
    apply: "build",
    config(confing) {
      _config = confing;
    },
    async transformIndexHtml(html) {
      if (!defaultCdns || defaultCdns.length === 0) throw new Error("defaultCdns不能为空");
      const packageJsonPath = path.resolve(process.cwd(), "package.json");
      try {
        const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
        const packageData = JSON.parse(packageJson);
        const external = _config.build.rollupOptions.external;
        const packNameUrl: { [k in PropertyCdn]?: string[] } = {};

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
          await Promise.all(
            urlListRes.map(async (item) => {
              if (!item) return;
              const { key, urls } = item;
              // 因为对应版本的package.json是相同的且都是从cdn获取的，所以只需要获取一个即可
              const findPackageJsonUrl = customScript[key] || urls[0];
              if (!findPackageJsonUrl) return;
              const packageJson = await getPackageJsonByUrl(findPackageJsonUrl);
              composeVersionObj(urlPackageJsonRes.dependencies, packageJson.dependencies);
            }),
          );
          // findUrls中会进行未找到版本的库的中断报错处理
          const { urls: noPackageUrls, noVersionPackages: notFindPackages } = await findUrls({
            external: noVersionPackages,
            packageData: urlPackageJsonRes,
            customScript,
            defaultCdns,
          });
          urlListRes.push(...noPackageUrls);
          if (notFindPackages.length > 0) {
            console.error(`找不到${notFindPackages.join(",")}的版本`);
            // TODO： 是否中断用户打包处理？
            throw new Error(`找不到${notFindPackages.join(",")}的版本`);
          }
        }
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
          if(nextCur>${retryTimes}){return;}
          
          const key = e.getAttribute("data-key");
          if(nextCur>=packNameUrl[key].length){return;}
          // 新的cdn链接
          const url = packNameUrl[key][nextCur]
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
        console.error("获取dependencies出错:", error);
      }
    },
  };
}
export default viteAddCdnScript;
