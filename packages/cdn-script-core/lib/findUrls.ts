import { PropertyCdn } from "./types";
import { PackageNetworkError, NoVersionError } from "./ErrorTypes";
import { composeVersionObj } from "./versionHandler";
import { getPackageVersion, getPackageURL, getPackageJsonByUrl } from "./core/lib";
import { getCdnCacheInstance, CdnErrorType, successCacheCellType, CacheCellType, failCacheCellType } from "./cache";

/**
 * 查找指定包的 CDN 链接，并返回 CDN 链接和版本不匹配的包的列表
 * @param external 需要查找 CDN 链接的包列表
 * @param packageData 包数据，包含依赖信息
 *   @example
 *   {
 *     "dependencies": {
 *       "react": "^17.0.2",
 *       "react-dom": "^17.0.2"
 *     },
 *     "devDependencies": {
 *       "vite": "^2.6.3"
 *     }
 *   }
 * @param customScript 自定义脚本
 * @param defaultCdns 默认的 CDN 列表
 * @return 一个 Promise，当解析完成时，将返回一个对象。
 */
export async function findUrls({
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
}): Promise<{
  urls: {
    urls: string[];
    key: string;
    version?: string;
  }[];
  noVersionPackages: string[];
  errorList: Error[];
}> {
  let noVersionPackages = [] as string[];
  let isUpdateCdnCache = false;
  let errorList: Error[] = [];
  const cdnCache = await getCdnCacheInstance();
  return await Promise.all(
    external.map(async (key) => {
      const version = getPackageVersion(packageData, key);

      if (customScript[key]) {
        return {
          urls: [customScript[key]],
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
        // 从缓存中获取cdn地址
        const urls = cacheUrls
          .filter((item, index) => {
            if (cloneDefaultCdns.has(item.cdnName) && item.success) {
              cloneDefaultCdns.delete(item.cdnName);
              return true;
            } else if (!item.success && item.error === CdnErrorType.noFound) {
              cloneDefaultCdns.delete(item.cdnName);
            } else {
              // 保存网络请求失败的cdn index 用于更新cdn
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
                errorList.push(item.reason);
              }
            }) as PromiseFulfilledResult<CacheCellType>[];
          });
          // 获取到了 之前为命中的cdn地址
          if (noMatchCdnRes.length > 0) {
            noMatchCdnRes.forEach((item) => {
              const index = networkCdnMap.get(item.value.cdnName);
              if (index !== undefined) {
                cacheUrls[index] = item.value;
              } else {
                cacheUrls.push(item.value);
              }
            });
            cdnCache.setCdnCache(key, version, cacheUrls);

            isUpdateCdnCache = true;
          }
        }
        return {
          urls,
          version,
          key,
        };
      } else {
        // 未命中cdn缓存
        isUpdateCdnCache = true;
        console.log(`从网络获取${key}${version}的cdn地址`);
        const packUrlRes: CacheCellType[] = await Promise.allSettled<CacheCellType>(
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
                errorList.push(item.reason);
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
            .filter((e) => !!e) as CacheCellType[];
        });

        const successUrls = (packUrlRes.filter((item: CacheCellType) => item.success) as successCacheCellType[]).map(
          (item) => item.url,
        );
        if (successUrls.length === 0) {
          throw new Error(`
            ${errorList.map((e) => e.message).join("\n")}获取${key} ${version}的cdn地址失败`);
        }
        const res = {
          urls: successUrls,
          version,
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
      errorList,
    };
  });
}

/**
 * 获取指定包的依赖包的package.json
 * @param packageVersionInfo 包的版本信息
 * @return 拼接后的package.json的dependencies字段和错误列表
 */
export const getPackageDependencies = async ({
  packageVersionInfo,
}: {
  packageVersionInfo: {
    key: string;
    urls: string[];
    version?: string;
  }[];
}) => {
  const urlPackageJsonRes: {
    dependencies: {
      [key: string]: string;
    };
  } = { dependencies: {} };
  let isUpdateCdnCache = false;
  const cdnCache = await getCdnCacheInstance();
  const errorList: Error[] = [];

  return await Promise.allSettled(
    packageVersionInfo.map(async (item) => {
      if (!item) return;
      const { urls } = item;
      // 因为对应版本的package.json是相同的且都是从cdn获取的，所以只需要获取一个即可
      const findPackageJsonUrl = urls[0];
      if (!findPackageJsonUrl) return;
      const cacheIdentification = item.version || findPackageJsonUrl;
      const cacheDependencies = cdnCache.getPackageDependencies(item.key, cacheIdentification);
      if (cacheDependencies) {
        return composeVersionObj(urlPackageJsonRes.dependencies, cacheDependencies.dependencies);
      }
      const packageJson = await getPackageJsonByUrl(findPackageJsonUrl);
      cdnCache.setPackageDependencies(item.key, cacheIdentification, {
        dependencies: packageJson.dependencies,
      });
      isUpdateCdnCache = true;
      composeVersionObj(urlPackageJsonRes.dependencies, packageJson.dependencies);
    }),
  ).then((data) => {
    if (isUpdateCdnCache) {
      cdnCache.save();
    }
    data.forEach((item) => {
      if (item.status === "rejected") {
        errorList.push(item.reason);
      }
    });
    return {
      urlPackageJsonRes,
      errorList,
    };
  });
};
