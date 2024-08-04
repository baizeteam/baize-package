export enum cdnTypes {
  jsdelivr = "jsdelivr",
  unpkg = "unpkg",
  bootcdn = "bootcdn",
  cdnjs = "cdnjs",
}

export type PropertyCdn = `${cdnTypes}`;

export enum EEnforce {
  PRE = "pre",
  POST = "post",
}

export interface IOptions {
  customScript?: { [key: string]: string };
  retryTimes?: number;
  defaultCdns?: PropertyCdn[];

  external: string[];
  uploadIgnore?: string;
  uploadFiles?: (filePath: string, info: {}) => string | Promise<string>;
}
