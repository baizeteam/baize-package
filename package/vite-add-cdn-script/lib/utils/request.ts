import https from "https";
import http from "http";

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

const req = {
  //get请求封装
  get: (link: string | URL | https.RequestOptions, callback?: (html: string) => void, fail?: (e: any) => void) => {
    return new Promise<string>((resolve, reject) => {
      try {
        https
          .get(link, (response: http.IncomingMessage) => {
            let html = "";
            response.on("data", (data) => {
              html += data;
            });
            response.on("end", () => {
              if (response.headers.location) {
                let location = response.headers.location;
                if (location.startsWith("http")) {
                  req.get(location, callback, fail).then(resolve, reject);
                  return;
                } else {
                  const url = new URL(link as string);
                  req.get(url.toString().replace(/(?<=\.\w+)\/.+/, location), callback, fail).then(resolve, reject);
                  return;
                }
              }
              callback?.(html);
              resolve(html);
            });
          })
          .on("error", function (error) {
            fail?.(error);
            reject(error);
          });
      } catch (error) {
        fail?.(error);
        reject(error);
      }
    });
  },
};

export default {
  get: limitReq.call.bind(limitReq, req.get) as typeof req.get,
};
