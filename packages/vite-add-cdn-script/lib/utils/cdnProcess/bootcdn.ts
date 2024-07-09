import { NetworkError, NoVersionError, PackageNetworkError } from "../ErrorTypes";
import req from "../request";
import { CdnUrlGeterrObj } from "./lib";
import semver from "semver";

export type bootcdnRes = {
  filename: string;
  assets: {
    files: string[];
    version: string;
  }[];
  [x: string]: unknown;
}[];
const getFileList = async (packageName: string, version: string) => {
  try {
    const res = await req.get<bootcdnRes>(`https://api.bootcdn.cn/libraries/${packageName}`);
    if (res.length === 0) {
      throw new NoVersionError({
        packageName,
        version,
        cdn: "bootcdn",
      });
    }
    // 一般第一项就是要找到的包，暂时没有遇到过在第二项的情况
    const packageInfo = res[0];
    const assets = packageInfo.assets.reverse();
    const versionItem = assets.find((item) => {
      if (semver.satisfies(item.version, version)) {
        return true;
      }
    });
    if (!versionItem) {
      throw new NoVersionError({
        packageName,
        version,
        cdn: "bootcdn",
      });
    }
    // 加 / 与 上面两种cdn做统一
    const fileList = versionItem.files.map((item) => {
      return {
        name: "/" + item,
      };
    });

    return { fileList, recommendFileName: packageInfo.filename, version: versionItem.version };
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new PackageNetworkError({
        packageName,
        version,
        cdn: "bootcdn",
      });
    }
    throw error;
  }
};
const getUrl = (packageName: string, confirmVersion: string, fileName: string) => {
  // https://cdn.bootcdn.net/ajax/libs/element-ui/2.15.14/index.min.js
  return `https://cdn.bootcdn.net/ajax/libs/${packageName}/${confirmVersion}${fileName}`;
};
const bootcdnProcess: CdnUrlGeterrObj = {
  getFileList,
  getUrl,
};
export default bootcdnProcess;
