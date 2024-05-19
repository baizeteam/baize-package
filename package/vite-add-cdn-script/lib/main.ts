// ts-check
import { resolve } from "path";
import { readFileSync } from "fs";
import { PluginOption } from "vite";

enum EEnforce {
  PRE = "pre",
  POST = "post",
}

const cdnUrlObj = {
  unpkg: "unpkg.com",
  bytedance: "lf26-cdn-tos.bytecdntp.com/cdn",
  staticfile: "cdn.staticfile.net",
  cdnjs: "cdnjs.cloudflare.com/ajax/libs",
  jsdelivr: "cdn.jsdelivr.net/npm",
  bootcdn: "cdn.bootcdn.net/ajax/libs",
};

const separators = {
  unpkg: "@",
  bytedance: "/",
  staticfile: "/",
  cdnjs: "/",
  jsdelivr: "@",
  bootcdn: "/",
};

const npmProObj = {
  react: "umd/react.production.min.js",
  "react-dom": "umd/react-dom.production.min.js",
  "react-router-dom": "react-router-dom.production.min.js",
  mobx: "mobx.umd.production.min.js",
  "mobx-react": "mobxreact.umd.production.min.js",
  vue: "vue.global.min.js",
  "vue-router": "vue-router.global.prod.min.js",
};

interface IOptions {
  protocol?: string;
  customScript?: { [key: string]: string };
  defaultCdns?: string[];
}

function viteAddCdnScript(opt: IOptions): PluginOption {
  // const { ...options } = opt;
  const {
    protocol = "https",
    customScript = {},
    defaultCdns = ["bootcdn", "bytedance", "unpkg", "cdnjs", "jsdelivr", "staticfile"],
  } = opt;
  let _config;
  return {
    name: "vite-add-cdn-script",
    enforce: EEnforce.PRE,
    apply: "build",
    config(confing) {
      _config = confing;
    },
    transformIndexHtml(html) {
      const packageJsonPath = resolve(process.cwd(), "package.json");
      try {
        const urlName = "bootcdn";
        const packageJson = readFileSync(packageJsonPath, "utf-8");
        const packageData = JSON.parse(packageJson);
        const external = _config.build.rollupOptions.external;
        let script = "";
        Object.keys(packageData.dependencies).forEach((key) => {
          if (external.includes(key)) {
            if (customScript[key]) {
              script += customScript[key];
            } else {
              const version = packageData.dependencies[key];
              const fileName = npmProObj[key] ? npmProObj[key] : `${key}.min.js`;
              const url = `${protocol}://${cdnUrlObj[urlName]}/${key}${separators[urlName]}${version.replace(
                "^",
                "",
              )}/${fileName}`;
              script += `<script src="${url}" type="text/javascript"></script>\n`;
            }
          }
        });
        html = html.replace("</head>", `${script}</head>`);
        return html;
      } catch (error) {
        console.error("获取dependencies出错:", error);
      }
      console.log("transformIndexHtml", packageJsonPath);
    },
  };
}
export default viteAddCdnScript;
