import { ACCEPT_IMG_TYPES, MAX_IMG_SIZE } from "./config";

export const checkImageType = (file: File) => {
  // 检查图片类型,根据 ACCEPT_IMG_TYPES 判断
  if (!ACCEPT_IMG_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type");
  }
};

export const isPng = (file: File) => {
  return file.type === "image/png";
};

export const isJpeg = (file: File) => {
  return file.type === "image/jpeg";
};

export const isWebp = (file: File) => {
  return file.type === "image/webp";
};

export const checkImageSize = (file: File) => {
  // 检查图片大小
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
