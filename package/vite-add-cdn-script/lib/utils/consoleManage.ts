import { libName } from "../main";

// 打印类型
export enum ConsoleType {
  log = "log",
  warn = "warn",
  error = "error",
  info = "info",
}

// 全局打印处理
export class ConsoleManage {
  // 打印记录
  private logList: {
    type: `${ConsoleType}`;
    message: string;
  }[] = [];

  // 打印方法
  public log(message: string) {
    this.logList.push({
      type: "log",
      message,
    });
  }
  public warn(message: string) {
    this.logList.push({
      type: "warn",
      message,
    });
  }
  public error(message: string) {
    this.logList.push({
      type: "error",
      message,
    });
  }
  public info(message: string) {
    this.logList.push({
      type: "info",
      message,
    });
  }

  // 打印全部
  public consoleAll() {
    this.logList.forEach((item) => {
      console[item.type](`${libName} ${item.message}`);
    });
  }

  // 清除打印记录
  public clear() {
    this.logList = [];
  }
}
