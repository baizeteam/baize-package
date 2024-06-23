// 打印类型
export enum ConsoleType {
  log = "log",
  warn = "warn",
  error = "error",
  info = "info",
}

// 全局打印处理
export default class ConsoleManage {
  // 打印记录
  private static logList: {
    type: `${ConsoleType}`;
    message: string;
  }[] = [];

  // 打印方法
  public static log(message: string) {
    this.logList.push({
      type: "log",
      message,
    });
  }
  public static warn(message: string) {
    this.logList.push({
      type: "warn",
      message,
    });
  }
  public static error(message: string) {
    this.logList.push({
      type: "error",
      message,
    });
  }
  public static info(message: string) {
    this.logList.push({
      type: "info",
      message,
    });
  }

  // 打印全部
  public static consoleAll() {
    this.logList.forEach((item) => {
      console[item.type](item.message);
    });
  }

  // 清除打印记录
  public static clear() {
    this.logList = [];
  }
}
