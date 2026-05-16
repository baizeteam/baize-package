import { MAX_IMG_SIZE } from "./config";

export const checkImageSize = (file: File) => {
  if (file.size > MAX_IMG_SIZE) {
    throw new Error("Image size is too large");
  }
};

export const transformBytes2HumanRead = (bytes: number) => {
  if (isNaN(bytes)) {
    return "";
  }
  const symbols = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let exp = Math.floor(Math.log(bytes) / Math.log(2));
  if (exp < 1) {
    exp = 0;
  }
  const i = Math.floor(exp / 10);
  bytes = bytes / Math.pow(2, 10 * i);

  let bytesString = "";

  if (bytes.toString().length > bytes.toFixed(2).toString().length) {
    bytesString = bytes.toFixed(2);
  } else {
    bytesString = `${bytes}`;
  }
  return bytesString + " " + symbols[i];
};

export const uuid = () => {
  const url = URL.createObjectURL(new Blob());
  const uuid = url.slice(-36);
  URL.revokeObjectURL(url);
  return uuid;
};
