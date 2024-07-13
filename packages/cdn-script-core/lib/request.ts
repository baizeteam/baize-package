import fetch from "node-fetch";
import { NetworkError } from "./ErrorTypes";
/**
 * 封装axios并发请求数
 */
export class LimitPromise {
  private _max: number;
  private _count: number;
  private _taskQueue: any[];

  constructor(max: number | undefined) {
    // 异步任务“并发”上限
    this._max = max || 5;
    // 当前正在执行的任务数量
    this._count = 0;
    // 等待执行的任务队列
    this._taskQueue = [];
  }

  /**
   * 请求封装
   * @param caller 请求函数
   * @param args 请求参数
   * @returns {Promise<any>} 返回一个promise
   */
  call(caller: (...arg: any[]) => any, ...args: any[]) {
    return new Promise((resolve, reject) => {
      const task = this._createTask(caller, args, resolve, reject);
      if (this._count >= this._max) {
        this._taskQueue.push(task);
      } else {
        task();
      }
    });
  }

  /**
   * 创建一个任务
   * @param caller 实际执行的函数
   * @param args 执行函数的参数
   * @param resolve
   * @param reject
   * @returns {Function} 返回一个任务函数
   * @private
   */
  _createTask(
    caller: (...arg: any[]) => any,
    argument: any[],
    resolve: (value: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
  ) {
    return () => {
      caller(...argument)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this._count--;
          if (this._taskQueue.length) {
            const task = this._taskQueue.shift();
            task();
          }
        });
      this._count++;
    };
  }
}
const limitReq = new LimitPromise(5);

export const followRedirect = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      return await followRedirect(res.headers.get("location") || "");
    }
    return url;
  } catch (error) {
    throw new NetworkError((error as Error).message);
  }
};
const req = {
  //get请求封装
  get: async <T>(link: string): Promise<T> => {
    try {
      const res = await fetch(link);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        const text = await res.text();
        if (contentType && contentType.includes("application/json")) {
          return JSON.parse(text);
        } else {
          return text as T;
        }
      } else {
        throw new NetworkError(`请求失败，状态码：${res.status}`);
      }
    } catch (error) {
      throw new NetworkError((error as Error).message);
    }
  },
};

export default {
  get: limitReq.call.bind(limitReq, req.get) as typeof req.get,
};
