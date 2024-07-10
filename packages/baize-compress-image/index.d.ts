import { Plugin } from 'vite';

interface Options {
  cdnSubPath: string;
  cdnigorePath: string;
}

export function compressImageWorker(options?: Options): Plugin;
