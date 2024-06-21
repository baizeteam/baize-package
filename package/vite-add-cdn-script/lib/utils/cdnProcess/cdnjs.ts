import req from "../request";
import { CdnUrlGeterrObj, FileNameRes } from "./lib";
import semver from "semver";
export type cdnjsLibrariesRes = {
  rawFiles: string[];
  error?: boolean;
  [x: string]: unknown;
};
type cdnjsVersionRes = {
  version: string[];
};

function getFileList(packageName: string, version: string, doubleFind = false) {
  return new Promise<FileNameRes>((resolve, reject) => {
    if (!doubleFind && version.match(/^\D/)) {
      getVersionList(packageName).then((versionList) => {
        for (let item of versionList) {
          if (semver.satisfies(item, version)) {
            getFileList(packageName, item, true).then(resolve, reject);
            return;
          }
        }
      });
      return;
    }
    const confirmVersion = version.match(/\d+(.\d+)?(.\d+)?/)?.[0];
    // https://api.cdnjs.com/libraries/jquery/3.5.1
    req.get(
      `https://api.cdnjs.com/libraries/${packageName}/${confirmVersion}`,
      (data: string) => {
        const res: cdnjsLibrariesRes = JSON.parse(data);
        if (res.error) {
          reject(new Error(`cdnjs: ${packageName}@${version} not found`));
          return;
        }
        resolve({
          fileList: res.rawFiles.map((item) => {
            return {
              name: "/" + item,
            };
          }),
          version,
        });
      },
      (e: unknown) => {
        reject(e);
      },
    );
  });
}
const getUrl = (packageName: string, version: string, fileName: string) => {
  // https://cdnjs.cloudflare.com/ajax/libs/react-is/18.3.1/cjs/react-is.production.min.js
  return `https://cdnjs.cloudflare.com/ajax/libs/${packageName}/${version}${fileName}`;
};
const getVersionList = (packageName: string) => {
  return req.get(`https://api.cdnjs.com/libraries/${packageName}?fields=versions`).then((data: string) => {
    const res: cdnjsVersionRes = JSON.parse(data);
    return res.version;
  });
};
const cdnjsProcess: CdnUrlGeterrObj = {
  getFileList,
  getUrl,
};
export default cdnjsProcess;
