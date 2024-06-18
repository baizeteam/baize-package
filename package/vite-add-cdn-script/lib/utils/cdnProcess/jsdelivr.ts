import req from "../request";
import { CdnUrlGeterrObj, FileNameRes } from "./lib";

const jsdelivrProcess: CdnUrlGeterrObj = {
  getFileList: (packageName: string, version: string) => {
    return new Promise<FileNameRes>((resolve, reject) => {
      // /v1/stats/packages/npm/{package}@{version}/files
      req.get(
        `https://data.jsdelivr.com/v1/stats/packages/npm/${packageName}@${version}/files`,
        (data: string) => {
          const res: (FileNameRes["fileList"][number] & {
            [x: string]: unknown;
          })[] = JSON.parse(data);
          if (res.length === 0) {
            reject(new Error(`${packageName}@${version} not found`));
            return;
          }
          resolve({ fileList: res });
        },
        (e: unknown) => {
          reject(e);
        },
      );
    });
  },
  // 拼接url
  getUrl: (packageName: string, version: string, fileName: string) => {
    // https://cdn.jsdelivr.net/npm/package@version/file
    return `https://cdn.jsdelivr.net/npm/${packageName}@${version}${fileName}`;
  },
};

export default jsdelivrProcess;
