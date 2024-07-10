/**
 * 比较版本号
 * @param version1 版本号1
 * @param version2 版本号2
 * @returns 1: version1 > version2, 0: version1 = version2, -1: version1 < version2
 * @example
 * compareVersion("1.0", "1.0.0") // 0
 * compareVersion("1", "1.0.0") // 0
 * compareVersion("1.0.1", "1.0") // 1
 * compareVersion("1.0", "1.0.1") // -1
 */
export function compareVersion(version1: string, version2: string): number {
  const version1Parts = version1.replace(/^\D/, "").split(".");
  const version2Parts = version2.replace(/^\D/, "").split(".");
  const maxLength = Math.max(version1Parts.length, version2Parts.length);

  while (version1Parts.length < maxLength) {
    version1Parts.push("0");
  }
  while (version2Parts.length < maxLength) {
    version2Parts.push("0");
  }

  for (let i = 0; i < maxLength; i++) {
    const num1 = parseInt(version1Parts[i], 10);
    const num2 = parseInt(version2Parts[i], 10);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}

type DependenciesType = {
  [key: string]: string;
};
/**
 * 合并版本若已经有版本号则取大版本
 * @param beComposedObj 被合成的对象
 * @param dependencies 依赖对象
 * @returns 合成后的对象
 */
export function composeVersionObj(beComposedObj: DependenciesType, dependencies: DependenciesType): DependenciesType {
  for (let item in dependencies) {
    if (Object.prototype.hasOwnProperty.call(dependencies, item)) {
      if (beComposedObj[item]) {
        const compareRes = compareVersion(beComposedObj[item], dependencies[item]);
        if (compareRes === -1) {
          beComposedObj[item] = dependencies[item];
        }
      } else {
        beComposedObj[item] = dependencies[item];
      }
    }
  }
  return beComposedObj;
}
