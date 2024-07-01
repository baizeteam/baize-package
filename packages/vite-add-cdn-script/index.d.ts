interface IOptions {
  customScript?: { [key: string]: string };
  defaultCdns?: string[];
}
export default function viteAddCdnScript(options: IOptions);
