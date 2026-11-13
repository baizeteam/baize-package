declare module "gifsicle-wasm-browser" {
  interface GifsicleRunOptions {
    input: Array<{
      file: string | Blob | ArrayBuffer;
      name: string;
    }>;
    command: string[];
    folder?: string[];
    isStrict?: boolean;
  }

  interface Gifsicle {
    tool: {
      workerLocalUrl: string;
    };
    run(options: GifsicleRunOptions): Promise<File[] | null>;
  }

  const gifsicle: Gifsicle;
  export default gifsicle;
}
