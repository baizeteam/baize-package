import { PropertyCdn } from "../types";

/**
 * 网络请求失败
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * 依赖包网络请求失败
 */
export class PackageNetworkError extends NetworkError {
  constructor({ packageName, version, cdn }: { packageName: string; version: string; cdn: PropertyCdn }) {
    super(`${cdn} ${packageName}@${version} 网络请求失败`);
    this.name = "PackageNetworkError";
  }
}

/**
 * 找不到依赖包
 */
export class NoVersionError extends Error {
  constructor({ packageName, version, cdn }: { packageName: string; version: string; cdn: PropertyCdn }) {
    super(`${cdn}上没有${packageName}@${version}的版本`);
    this.name = "NoVersionError";
  }
}

/**
 * 文件获取失败错误
 */
export class GetFileListError extends Error {
  constructor({ packageName, version, cdn }: { packageName: string; version: string; cdn: PropertyCdn }) {
    super(`在 ${cdn} 中找不到 ${packageName}@${version} 文件，请检查包名或版本号`);
    this.name = "GetFileListError";
  }
}
