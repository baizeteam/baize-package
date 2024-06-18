import req from "../request";
import { CdnUrlGeterrObj, FileNameRes } from "./lib";

export type cdnjsRes = {
  rawFiles: string[];
  error?: boolean;
  [x: string]: unknown;
};

const cdnjsProcess: CdnUrlGeterrObj = {
  getFileList: (packageName: string, version: string) => {
    return new Promise<FileNameRes>((resolve, reject) => {
      // https://api.cdnjs.com/libraries/jquery/3.5.1
      req.get(
        `https://api.cdnjs.com/libraries/${packageName}/${version}`,
        (data: string) => {
          const res: cdnjsRes = JSON.parse(data);
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
          });
        },
        (e: unknown) => {
          reject(e);
        },
      );
    });
  },
  getUrl: (packageName: string, version: string, fileName: string) => {
    // https://cdnjs.cloudflare.com/ajax/libs/react-is/18.3.1/cjs/react-is.production.min.js
    return `https://cdnjs.cloudflare.com/ajax/libs/${packageName}/${version}${fileName}`;
  },
};
export default cdnjsProcess;
