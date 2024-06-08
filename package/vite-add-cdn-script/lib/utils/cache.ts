import path from "path";
import { PropertyCdn } from "../types";

import fs from "fs";
/**
 * 本地缓存控制类
 */
class CdnCache {
  private cdnCache: {
    [k in PropertyCdn]?: {
      [version: string]: string[];
    };
  };
  private cdnCachePath: string;
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
      this.cdnCache = {};
      await fs.writeFileSync(this.cdnCachePath, "", "utf-8");
    }
  }

  /**
   * 获取cdn缓存
   * @param packageName  包名
   * @param version   版本
   */
  getCdnCache(packageName: string, version: string): string[] | undefined {
    return this.cdnCache[packageName]?.[version];
  }
  /**
   * 设置cdn缓存
   * @param packageName  包名
   * @param version   版本
   * @param urls  地址列表
   */
  setCdnCache(packageName: string, version: string, urls: string[]) {
    if (this.cdnCache[packageName]) {
      this.cdnCache[packageName][version] = urls;
    } else {
      this.cdnCache[packageName] = {
        [version]: urls,
      };
    }
  }
  /**
   * 更新cdn缓存
   */
  async save() {
    await fs.writeFileSync(this.cdnCachePath, JSON.stringify(this.cdnCache), "utf-8");
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
