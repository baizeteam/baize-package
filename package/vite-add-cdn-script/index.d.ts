type GenerateScopedNameType = (localName: string, resourcePath: string) => string;
type GenerateScopedNameConfigurationType = GenerateScopedNameType | string;
type HandleMissingStyleNameOptionType = any;
interface ReactCssModuleOptions {
  context?: string;
  exclude?: string;
  filetypes?: {
    [key: string]: {
      syntax: string;
      [key: string]: any;
    };
  };
  removeImport?: boolean;
  generateScopedName?: GenerateScopedNameConfigurationType;
  handleMissingStyleName?: HandleMissingStyleNameOptionType;
  attributeNames?: { styleName: string };
  skip?: boolean;
  autoResolveMultipleImports?: boolean;
  alias?: { [key: string]: string };
}
export default function viteReactStyleName(options: ReactCssModuleOptions);
