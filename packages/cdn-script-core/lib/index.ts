import { ConsoleManage } from "./consoleManage";
import { findUrls, getPackageDependencies } from "./findUrls";

import path from "path";
export * from "./consoleManage";
export * from "./common";
export * from "./generateScript";
export * from "./findUrls";
export * from "./ErrorTypes";
export * from "./upload";
import fs from "fs";
import { PropertyCdn } from "./types";
import { generateScript } from "./generateScript";
import { isObject, isStr } from "./common";

export type ExternalOption = any;

export async function getExternalScript({
  libName,
  customScript,
  external: inputExternal,
  defaultCdns,
}: {
  libName: string;
  external: ExternalOption;
  customScript: { [key: string]: string };
  defaultCdns: PropertyCdn[];
}) {
  let consoleManage: ConsoleManage = new ConsoleManage(libName);
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  if (!inputExternal) {
    return "";
  }
  let external: string[] = [];
  if (isStr(inputExternal)) {
    external = [inputExternal];
  } else if (Array.isArray(inputExternal)) {
    external = inputExternal.filter((item) => typeof item === "string") as string[];
  } else if (isObject(inputExternal)) {
    external = Object.keys(inputExternal);
  } else {
    return "";
  }

  try {
    const packageJson = fs.readFileSync(packageJsonPath, "utf-8");

    const packageData = JSON.parse(packageJson);
    const {
      urls: urlListRes,
      noVersionPackages,
      errorList,
    } = await findUrls({
      external,
      packageData,
      customScript,
      defaultCdns,
    });
    consoleManage.addMessageList("warn", errorList);
    // 没有找到本地版本的库，在库中寻找对应的版本
    if (noVersionPackages.length > 0) {
      const { urlPackageJsonRes, errorList: packageDependErrorList } = await getPackageDependencies({
        packageVersionInfo: urlListRes,
      });
      consoleManage.addMessageList("warn", packageDependErrorList);
      const {
        urls: noPackageUrls,
        noVersionPackages: notFindPackages,
        errorList,
      } = await findUrls({
        external: noVersionPackages,
        packageData: urlPackageJsonRes,
        customScript,
        defaultCdns,
      });
      consoleManage.addMessageList("warn", errorList);
      // 合并未找到版本的库的cdn地址列表（保持原有顺序）
      noPackageUrls.map((item) => {
        if (!item) return;
        const { urls, key } = item;
        urlListRes.find((item) => item?.key === key)?.urls.push(...urls);
      });

      if (notFindPackages.length > 0) {
        throw new Error(`找不到${notFindPackages.join(",")}的版本`);
      }
    }

    consoleManage.consoleAll();

    const script = generateScript(urlListRes);
    return script;
  } catch (error) {
    consoleManage.consoleAll();
    throw error;
  }
}
