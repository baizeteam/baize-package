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
export const cdnUrlGeterr: {
  [cdn in PropertyCdn]: {
    getFileList: (packageName: string, version: string) => Promise<FileNameRes>;
    getUrl: (packageName: string, version: string, fileName: string) => string;
  };
} = {
  jsdelivr: {
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
  },
  unpkg: {
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
  },
  bootcdn: {
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

            resolve({ fileList, recommendFileName: packageInfo.filename });
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
  },
  cdnjs: {
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
  },
};

/**
 * 获取特定包在特定CDN上的URL。
 *
 * @param packageName 包名
 * @param version 版本号
 * @param cdn CDN类型
 * @returns 返回特定包在特定CDN上的URL
 *
 * @throws 如果版本号不符合规定的格式，将抛出错误
 */
export const getPackageURL = async (packageName: string, version: string, cdn: PropertyCdn) => {
  // 再这一步做分离是为了之后可能做 @ ~ 等符号的处理,🤔每个cdn的具体方案可能不同
  const confirmVersion = version.match(/\d+(.\d+)?(.\d+)?/)?.[0];
  if (!confirmVersion) {
    throw new Error(`${packageName} version ${version} is not valid`);
  }
  const res = await cdnUrlGeterr[cdn].getFileList(packageName, confirmVersion).catch((e) => {
    throw e;
  });

  const fileName = getPackageFile(res, packageName);
  if (!fileName) {
    throw new Error(
      `Can't find the file of ${packageName}@${confirmVersion} in ${cdn}, please check the package name or version`,
    );
  }
  return cdnUrlGeterr[cdn].getUrl(packageName, confirmVersion, fileName);
};

/**
 * 获取推荐的文件名
 *
 * @param fileList 文件列表
 * @param packageName 包名
 * @returns 返回推荐的文件名 (如果有的话) 或空字符串 (没有匹配到)
 */
const getPackageFile = ({ fileList }: FileNameRes, packageName: string) => {
  // 优先推荐文件
  let recommendList: (RegExp | string)[] = [
    `umd/${packageName}.production.min.js`,
    /umd\/.+?\.production\.min\.js$/,
    /dist\/.+?\.production\.min\.js$/,
    /dist\/.+?\.umd\.min\.js$/,
    `dist/${packageName}.prod.min.js`,
    /dist\/.+?\.global.prod.min.js/,
    `dist/${packageName}.min.js`,
    /.+?\.global.prod.min.js/,
    /.+?.global.prod.js/,
    /lib\/.+?\.min\.js$/,
    /dist\/.+?\.min\.js$/,
    /index\.min\.js$/,
    /index\.js$/,
    /\.min\.js$/,
    /\.js$/,
  ];
  // 黑名单匹配
  const blackList = ["runtime", "compiler", ".esm", ".cjs", "development"].filter((item) => {
    return !packageName.includes(item);
  });

  let selectFile = "";

  for (let item of recommendList) {
    if (item instanceof RegExp) {
      selectFile =
        fileList.find((file) => {
          return item.test(file.name) && !blackList.some((blackItem) => file.name.includes(blackItem));
        })?.name || "";
    } else {
      selectFile =
        fileList.find((file) => {
          return file.name.includes(item) && !blackList.some((blackItem) => file.name.includes(blackItem));
        })?.name || "";
    }
    if (selectFile) {
      break;
    }
  }
  return selectFile;
};
