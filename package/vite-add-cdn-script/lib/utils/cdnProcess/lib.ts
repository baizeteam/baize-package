import { PropertyCdn } from "../../types";
import req from "../request";
import bootcdnProcess from "./bootcdn";
import cdnjsProcess from "./cdnjs";
import jsdelivrProcess from "./jsdelivr";
import unpkgProcess from "./unpkg";

export type FileNameRes = {
  fileList: {
    name: string;
  }[];
  version: string;
  recommendFileName?: string;
};

export type CdnUrlGeterrObj = {
  getFileList: (packageName: string, version: string) => Promise<FileNameRes>;
  getUrl: (packageName: string, version: string, fileName: string) => string;
  getVersionList?: (packageName: string) => Promise<string[]>;
};

/**
 *  获取package.json中的依赖版本
 */
export const getPackageJsonByUrl = async (url: string) => {
  const packUrlRex = /^(https?:\/\/.*\d+\.\d+\.\d+\/).+?\.js$/;
  if (packUrlRex.test(url)) {
    const packageJsonUrl = url.replace(packUrlRex, (_: string, suffix: string) => {
      return `${suffix}package.json`;
    });
    return JSON.parse(await req.get(packageJsonUrl));
  } else {
    throw new Error(`${url} 不是正确的url`);
  }
};

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
  const confirmVersion = version.match(/\d+(.\d+)?(.\d+)?/);
  if (!confirmVersion) {
    throw new Error(`${packageName} version ${version} is not valid`);
  }

  const res = await cdnUrlGeterr[cdn].getFileList(packageName, version).catch((err) => {
    throw new Error(`${err} ${packageName} ${version} ${cdn} API 请求失败`);
  });

  const fileName = getPackageFile(res, packageName);
  if (!fileName) {
    throw new Error(`在 ${cdn} 中找不到 ${packageName}@${confirmVersion} 文件，请检查包名或版本号`);
  }
  return cdnUrlGeterr[cdn].getUrl(packageName, res.version, fileName);
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

/**
 * 各个类型cdn url file获取处理与统一
 */
export const cdnUrlGeterr: {
  [cdn in PropertyCdn]: CdnUrlGeterrObj;
} = {
  jsdelivr: jsdelivrProcess,
  bootcdn: bootcdnProcess,
  cdnjs: cdnjsProcess,
  unpkg: unpkgProcess,
};
