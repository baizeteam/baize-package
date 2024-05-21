import path from "node:path";
import fs from "node:fs";
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

export interface IOptions {
  protocol?: string;
  customScript?: { [key: string]: string };
  retryTimes?: number;
  defaultCdns?: string[];
}

function viteAddCdnScript(opt: IOptions): PluginOption {
  const {
    protocol = "https",
    customScript = {},
    retryTimes = 3,
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
      const packageJsonPath = path.resolve(process.cwd(), "package.json");
      try {
        const urlName = "bootcdn";
        const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
        const packageData = JSON.parse(packageJson);
        const external = _config.build.rollupOptions.external;
        const errorScript = `<script>
  const separators = JSON.parse('${JSON.stringify(separators)}');
  const cdnUrlObj = JSON.parse('${JSON.stringify(cdnUrlObj)}');
  const defaultCdns = JSON.parse('${JSON.stringify(defaultCdns)}');
  function errorCDN(e) {
    const nextCur = parseInt(e.getAttribute("data-cur")) + 1;
    if(nextCur>=${retryTimes}){return;}
    const filename = e.getAttribute("data-filename");
    const key = e.getAttribute("data-key");
    const urlName = defaultCdns[nextCur]
    // 组装新的cdn链接
    const url = location.protocol + "//" + cdnUrlObj[urlName] + "/" + key + separators[urlName] + filename;
    // 克隆原标签
    const tagName = e.tagName
    const cdnDOM = document.createElement(tagName);
    cdnDOM.setAttribute(tagName === 'SCRIPT' ?'src' : 'href', url);
    Object.keys(e.dataset).forEach(_key => {
      cdnDOM.setAttribute('data-'+_key, e.dataset[_key]);
    })
    cdnDOM.setAttribute("data-cur", nextCur.toString());
    cdnDOM.setAttribute("onerror", "errorCDN(this)");
    document.head.appendChild(cdnDOM);
    e.remove();
  }
</script>`;

        let script = "" + errorScript;
        Object.keys(packageData.dependencies).forEach((key) => {
          if (external.includes(key)) {
            if (customScript[key]) {
              script += customScript[key];
            } else {
              const version = packageData.dependencies[key];
              const fileName = version.replace("^", "") + "/" + (npmProObj[key] ? npmProObj[key] : `${key}.min.js`);
              const url = `${protocol}://${cdnUrlObj[urlName]}/${key}${separators[urlName]}${fileName}`;
              script += `<script src="${url}" type="text/javascript" onerror="errorCDN(this)" data-cur="0" data-key="${key}" data-filename="${fileName}"></script>\n`;
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
