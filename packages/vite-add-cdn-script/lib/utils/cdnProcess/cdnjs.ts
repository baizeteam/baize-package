import { NetworkError, NoVersionError, PackageNetworkError } from "../ErrorTypes";
import req from "../request";
import { CdnUrlGeterrObj } from "./lib";
import semver from "semver";
export type cdnjsLibrariesRes = {
  rawFiles: string[];
  error?: boolean;
  [x: string]: unknown;
};
type cdnjsVersionRes = {
  versions: string[];
};

async function getFileList(packageName: string, version: string, doubleFind = false) {
  try {
    if (!doubleFind && version.match(/^\D/)) {
      const versionList = await getVersionList(packageName, version);
      for (let item of versionList) {
        if (semver.satisfies(item, version)) {
          return getFileList(packageName, item, true);
        }
      }
      throw new NoVersionError({
        packageName,
        version,
        cdn: "cdnjs",
      });
    }
    const res = await req.get<cdnjsLibrariesRes>(`https://api.cdnjs.com/libraries/${packageName}/${version}`);
    if (res.error) {
      throw new NoVersionError({
        packageName,
        version,
        cdn: "cdnjs",
      });
    }
    return {
      fileList: res.rawFiles.map((item) => {
        return {
          name: "/" + item,
        };
      }),
      version,
    };
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new PackageNetworkError({
        packageName,
        version,
        cdn: "unpkg",
      });
    }
    throw error;
  }
}
const getUrl = (packageName: string, version: string, fileName: string) => {
  // https://cdnjs.cloudflare.com/ajax/libs/react-is/18.3.1/cjs/react-is.production.min.js
  return `https://cdnjs.cloudflare.com/ajax/libs/${packageName}/${version}${fileName}`;
};
const getVersionList = async (packageName: string, version: string) => {
  try {
    const res = await req.get<cdnjsVersionRes>(`https://api.cdnjs.com/libraries/${packageName}?fields=versions`);
    return res.versions;
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new PackageNetworkError({
        packageName,
        version,
        cdn: "unpkg",
      });
    }
    throw error;
  }
};
const cdnjsProcess: CdnUrlGeterrObj = {
  getFileList,
  getUrl,
};
export default cdnjsProcess;
