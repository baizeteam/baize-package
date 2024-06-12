export type PropertyCdn = "jsdelivr" | "unpkg" | "bootcdn" | "cdnjs";

export type unpkyDirectory = {
  path: string;
  type: "directory";
  files?: (unpkyDirectory | unpkgFiles)[];
  [x: string]: unknown;
};
export type unpkgFiles = {
  path: string;
  type: "file";
  [x: string]: unknown;
};
export type unpkgRes = unpkyDirectory;

export type bootcdnRes = {
  filename: string;
  assets: {
    files: string[];
    version: string;
  }[];
  [x: string]: unknown;
}[];

export type cdnjsRes = {
  rawFiles: string[];
  error?: boolean;
  [x: string]: unknown;
};
