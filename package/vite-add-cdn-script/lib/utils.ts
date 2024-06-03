import https from "https";
import http from "http";
import { unpkyDirectory, unpkgFiles, unpkgRes, PropertyCdn, bootcdnRes, cdnjsRes } from "./types";

const req = {
  //get请求封装
  get: (link: string | URL | https.RequestOptions, callback: (html: string) => void, fail: (e: any) => void) => {
    try {
      https.get(link, (req: http.IncomingMessage) => {
        var html = "";
        req.on("data", (data) => {
          html += data;
        });
        req.on("end", () => {
          callback(html);
        });
      });
    } catch (error) {
      fail(error);
    }
  },
};

export const getNpmPackageUrl = {};

/**
 * 获取package.json中的依赖版本
 * @param packageJson  package.json
 * @param key       依赖名称
 * @returns      依赖版本
 */
export const getPackageVersion = (
  packageJson: {
    devDependencies: Record<string, string>;
    dependencies: Record<string, string>;
  },
  key: string,
) => {
  return packageJson.dependencies?.[key] || packageJson.devDependencies?.[key];
};

type FileNameRes = {
  fileList: {
    name: string;
  }[];
  recommendFileName?: string;
};

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

/**
 * 各个类型cdn url file获取处理与统一
 */
export const cdnUrlGet: {
  [cdn in PropertyCdn]: (packageName: string, version: string) => Promise<FileNameRes>;
} = {
  jsdelivr: (packageName: string, version: string) => {
    return new Promise<FileNameRes>((resolve, reject) => {
      // /v1/stats/packages/npm/{package}@{version}/files
      req.get(
        `https://data.jsdelivr.com/v1/stats/packages/npm/${packageName}@${version}/files?period=day`,
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
  unpkg: (packageName: string, version: string) => {
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
  bootcdn: (packageName: string, version: string) => {
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

          resolve({ fileList, recommendFileName: packageInfo.filename });
        },
        (e: unknown) => {
          reject(e);
        },
      );
    });
  },
  cdnjs: (packageName: string, version: string) => {
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
};

const getPackageCdnUrl = ({
  packageName,
  version,
  cdn,
}: {
  packageName: string;
  version: string;
  cdn: PropertyCdn;
}) => {
  return packageName.split("/").pop();
};
