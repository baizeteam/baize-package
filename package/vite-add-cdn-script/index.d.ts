interface IOptions {
  protocol?: string;
  customScript?: { [key: string]: string };
  retryTimes?: number;
  defaultCdns?: string[];
}
export default function viteAddCdnScript(options: IOptions);
