import req from "../request";
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
function getFileList(packageName: string, version: string) {
  // unpkg.com/react@18.3.1/?meta
  return new Promise<FileNameRes>((resolve, reject) => {
    // unpkg.com version能直接传入解析规则
    req.get(
      `https://unpkg.com/${packageName}@${version}/?meta`,
      (data: string) => {
        try {
          const res: unpkgRes = JSON.parse(data);
          resolve({ fileList: unpkgDirectoryHandle(res.files || []), version });
        } catch (err) {
          reject(err);
        }
      },
      (e: unknown) => {
        reject(e);
      },
    );
  });
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
