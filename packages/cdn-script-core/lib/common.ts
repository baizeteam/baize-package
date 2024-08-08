import path from "node:path";
// Object.prototype.toString.call
function toStringCall(obj: any) {
  return Object.prototype.toString.call(obj);
}
// isString
export function isStr(obj: any): obj is string {
  return toStringCall(obj) === "[object String]";
}
// isObject
export function isObject(obj: any): obj is Object {
  return toStringCall(obj) === "[object Object]";
}

const windowsSlashRE = /\\/g;
/**
 *  Convert Windows backslash paths to slash paths: 'foo\\bar' ➔ 'foo/bar'
 * @param p  path
 * @returns  path
 */
export function slash(p: string): string {
  return p.replace(windowsSlashRE, "/");
}
// 是否是windows系统
export const isWindows = typeof process !== "undefined" && process.platform === "win32";
/**
 *  Normalize a file path.
 * @param id  file path
 * @returns   file path
 */
export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}

/**
 *  Get the script src in the html
 * @param html  html
 * @returns  script src
 */
export function getScriptSrcs(html: string): string[] | null {
  return html.match(/(?<=<script.*?src=(["|']))(?=[./]).*?(?=\1)|(?<=<link.*?href=(["|']))(?=[./]).*?(?=\2)/g);
}

/**
 *  Get the  script link tag and attrStr and href or src
 * @param html html
 * @returns  {
 * tag: string;
 * src: string;
 * attrStr: string;
 * }[]
 */
export function getLoadTagAndAttrStr(html: string): {
  tag: string;
  src: string;
  attrStr: string;
}[] {
  const linkTagReg =
    /(?<=<(script)(.*?)src=(["|']))(?=[./]).*?(?=\3([^><]*?)(?=\/?>))|(?<=<(link)(.*?)href=(["|']))(?=[./]).*?(?=\7([^><]*?)(?=\/?>))/g;
  let loadTagMatch = [...html.matchAll(linkTagReg)];
  return loadTagMatch.map((item) => {
    const tag = item[1] || item[5];
    const src = item[0];
    const attrStr = item[2] + item[4] || item[6] + item[8];
    return {
      tag,
      src,
      attrStr,
    };
  });
}
