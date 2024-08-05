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
  return html.match(/(?<=<script.*?src=(["|']))(?=[./])(.*?)(?=\1)/g);
}
