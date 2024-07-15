// Object.prototype.toString.call
function toStringCall(obj: any) {
  return Object.prototype.toString.call(obj);
}
// isString
export function isStr(obj: any): obj is String {
  return toStringCall(obj) === "[object String]";
}
// isObject
export function isObject(obj: any): obj is Object {
  return toStringCall(obj) === "[object Object]";
}
