import { NetworkError, NoVersionError, PackageNetworkError } from "../ErrorTypes";
import req, { followRedirect } from "../request";
import { CdnUrlGeterrObj, FileNameRes } from "./lib";

export type unpkyDirectory = {
  path: string;
  type: "directory";
  files?: (unpkyDirectory | unpkgFiles)[];
  [x: string]: unknown;
};
export type unpkgFiles = {
  path: string;
  type: "file";
  [x: string]: unknown;
};
export type unpkgRes = unpkyDirectory;

/**
 * unpakg directory处理
 */
export const unpkgDirectoryHandle = (res: (unpkyDirectory | unpkgFiles)[]) => {
  return res.reduce((pre, cur) => {
    if (cur.type === "file") {
      pre.push({ name: cur.path });
    } else if (cur.files) {
      pre.push(...unpkgDirectoryHandle(cur.files));
    }
    return pre;
  }, [] as FileNameRes["fileList"]);
};
async function getFileList(packageName: string, version: string) {
  try {
    // unpkg 重定向到正确的包版本
    const redirectRes = await followRedirect(`https://unpkg.com/${packageName}@${version}/?meta`);
    const versionRes = redirectRes.match(/(?<=@)\d+\.\d+\.\d+(?=\/\?meta)/)?.[0];
    if (versionRes) {
      const res = await req.get<unpkgRes>(`https://unpkg.com/${packageName}@${versionRes}/?meta`);
      return { fileList: unpkgDirectoryHandle(res.files || []), version: versionRes };
    } else {
      throw new NoVersionError({
        packageName,
        version,
        cdn: "unpkg",
      });
    }
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
function getUrl(packageName: string, version: string, fileName: string) {
  // unpkg.com/:package@:version/:file
  return `https://unpkg.com/${packageName}@${version}${fileName}`;
}

const unpkgProcess: CdnUrlGeterrObj = {
  getFileList,
  getUrl,
};

export default unpkgProcess;
