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

const unpkgProcess: CdnUrlGeterrObj = {
  getFileList: (packageName: string, version: string) => {
    // unpkg.com/react@18.3.1/?meta
    return new Promise<FileNameRes>((resolve, reject) => {
      req.get(
        `https://unpkg.com/${packageName}@${version}/?meta`,
        (data: string) => {
          const res: unpkgRes = JSON.parse(data);
          resolve({ fileList: unpkgDirectoryHandle(res.files || []) });
        },
        (e: unknown) => {
          reject(e);
        },
      );
    });
  },
  getUrl: (packageName: string, version: string, fileName: string) => {
    // unpkg.com/:package@:version/:file
    return `https://unpkg.com/${packageName}@${version}${fileName}`;
  },
};

export default unpkgProcess;
