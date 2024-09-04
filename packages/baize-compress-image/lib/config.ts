export const DEFAULT_FORAGE_CONFIG = {
  name: "baize-compress-image",
  storeName: "baize-compress-image",
  driver: "asyncStorage", //  因为vite lib模式下，worker暂不支持localforge的import方式，此处直接定义为asyncStorage，即localforage.INDEXEDDB实际值
};

export const DEFAULT_QUALITY = 0.8;

// TODO 支持gif压缩
export const ACCEPT_IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MAX_IMG_SIZE = 1024 * 1024 * 50; // 50MB
