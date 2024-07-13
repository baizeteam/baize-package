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

  // 打印前缀
  private prefixString: string = "cdn-script";
  constructor(prefixString?: string) {
    if (prefixString) {
      this.prefixString = prefixString;
    }
  }

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
    // 跟打印内容之间加一个空行
    console.log("");
    this.logList.forEach((item) => {
      console[item.type](`${this.prefixString} ${item.message}`);
    });
  }

  public addMessageList(
    addType: `${ConsoleType}`,
    messages:
      | string[]
      | {
          toString: () => string;
        }[],
  ) {
    messages.forEach((item) => {
      this.logList.push({
        type: addType,
        message: item.toString(),
      });
    });
  }

  // 清除打印记录
  public clear() {
    this.logList = [];
  }
}
