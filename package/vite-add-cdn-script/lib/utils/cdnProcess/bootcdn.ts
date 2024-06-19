import req from "../request";
import { CdnUrlGeterrObj, FileNameRes } from "./lib";

export type bootcdnRes = {
  filename: string;
  assets: {
    files: string[];
    version: string;
  }[];
  [x: string]: unknown;
}[];
const bootcdnProcess: CdnUrlGeterrObj = {
  getFileList: (packageName: string, version: string) => {
    return new Promise<FileNameRes>((resolve, reject) => {
      // https://api.bootcdn.cn/libraries/react
      req.get(
        `https://api.bootcdn.cn/libraries/${packageName}`,
        (data: string) => {
          const res: bootcdnRes = JSON.parse(data);
          if (res.length === 0) {
            reject(new Error(`${packageName} not found in bootcdn`));
            return;
          }
          // 一般第一项就是要找到的包，暂时没有遇到过在第二项的情况
          const packageInfo = res[0];
          const assets = packageInfo.assets;
          const versionItem = assets.find((item) => {
            return item.version === version;
          });
          if (!versionItem) {
            reject(new Error(`${packageName}@${version} not found in ${packageInfo.name}`));
            return;
          }
          // 加 / 与 上面两种cdn做统一
          const fileList = versionItem.files.map((item) => {
            return {
              name: "/" + item,
            };
          });

          resolve({ fileList, recommendFileName: packageInfo.filename, version });
        },
        (e: unknown) => {
          reject(e);
        },
      );
    });
  },
  getUrl: (packageName: string, confirmVersion: string, fileName: string) => {
    // https://cdn.bootcdn.net/ajax/libs/element-ui/2.15.14/index.min.js
    return `https://cdn.bootcdn.net/ajax/libs/${packageName}/${confirmVersion}${fileName}`;
  },
};
export default bootcdnProcess;
