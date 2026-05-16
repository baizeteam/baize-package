export interface CompressResult {
  success: boolean;
  data?: ArrayBuffer;
  fileName?: string;
  fileType?: string;
  error?: string;
}

export interface CompressParams {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  quality: number;
}

export interface CompressPlugin {
  name: string;
  matches: (fileType: string) => boolean;
  createWorker: () => Worker;
}

export interface CompressBackInfo {
  compressInfo: {
    rate: number;
    time: number;
    originalSize: number;
    compressedSize: number;
  };
  file: File;
}

export interface CompressOptions {
  quality?: number;
}
