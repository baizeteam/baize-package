import path from "path";

import fs from "fs";
import { PropertyCdn } from "./types";

export type CacheFileType = {
  packageDependencies: {
    [packageName: string]: {
      // url为对应搜索package.json的url
      [identification: string]: Dependencies;
    };
  };
  cdnsUrl: {
    [packageName: string]: {
      [version: string]: CacheCellType[];
    };
  };
};
export type Dependencies = {
  dependencies: {
    [key: string]: string;
  };
};
export enum CdnErrorType {
  noFound = "noFound",
  NetworkError = "networkError",
}
export type successCacheCellType = {
  cdnName: PropertyCdn;
  url: string;
  success: true;
};

export type failCacheCellType = {
  cdnName: PropertyCdn;
  success: false;
  error: CdnErrorType;
};
export type CacheCellType = successCacheCellType | failCacheCellType;

/**
 * 本地缓存控制类
 */
class CdnCache {
  private cdnCache: CacheFileType = {
    packageDependencies: {},
    cdnsUrl: {},
  };
  private cdnCachePath: string = "";
  constructor() {
    // cdn缓存文件
    this.cdnCachePath = path.resolve(process.cwd(), "./.cdn-cache.json");
  }

  // 初始化cdn缓存
  async init() {
    try {
      // 读取文件内容
      const cdnCacheFileText = await fs.readFileSync(this.cdnCachePath, "utf-8");
      this.cdnCache = JSON.parse(cdnCacheFileText);
    } catch (err) {
      console.log("cdn缓存文件不存在，创建缓存文件");
      this.cdnCache = {
        packageDependencies: {},
        cdnsUrl: {},
      };
      await fs.writeFileSync(this.cdnCachePath, "", "utf-8");
    }
  }

  /**
   * 获取cdn缓存
   * @param packageName  包名
   * @param version   版本
   */
  getCdnCache(packageName: string, version: string): CacheCellType[] | undefined {
    return this.cdnCache["cdnsUrl"][packageName]?.[version];
  }
  /**
   * 设置cdn缓存
   * @param packageName  包名
   * @param version   版本
   * @param urls  地址列表
   */
  setCdnCache(packageName: string, version: string, cdnData: CacheCellType[]) {
    if (this.cdnCache["cdnsUrl"][packageName]) {
      this.cdnCache["cdnsUrl"][packageName][version] = cdnData;
    } else {
      this.cdnCache["cdnsUrl"][packageName] = {
        [version]: cdnData,
      };
    }
  }
  /**
   * 更新cdn缓存
   */
  async save() {
    await fs.writeFileSync(this.cdnCachePath, JSON.stringify(this.cdnCache), "utf-8");
  }

  /**
   * 获取依赖包的package.json
   * @param packageName  包名
   * @param identification   版本号或者url
   */
  getPackageDependencies(packageName: string, identification: string): Dependencies | undefined {
    return this.cdnCache["packageDependencies"][packageName]?.[identification];
  }
  /**
   * 设置依赖包的package.json
   * @param packageName  包名
   * @param identification    版本号或者url
   * @param dependencies  依赖
   */
  setPackageDependencies(packageName: string, identification: string, dependencies: Dependencies) {
    if (this.cdnCache["packageDependencies"][packageName]) {
      this.cdnCache["packageDependencies"][packageName][identification] = dependencies;
    } else {
      this.cdnCache["packageDependencies"][packageName] = {
        [identification]: dependencies,
      };
    }
  }
}

// 单例模式
let instance: CdnCache;
const getCdnCacheInstance = async () => {
  if (!instance) {
    instance = new CdnCache();
    await instance.init();
  }
  return instance;
};

export { getCdnCacheInstance, CdnCache };
