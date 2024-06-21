import req from "../request";
import { CdnUrlGeterrObj, FileNameRes } from "./lib";

interface JsdeliverFile {
  type: "file";
  name: string;
  hash: string;
  size: number;
}

interface JsdeliverDirectory {
  type: "directory";
  name: string;
  files: (JsdeliverFile | JsdeliverDirectory)[];
}

interface JsdeliverLinks {
  stats: string;
  entrypoints: string;
}

interface JsdeliverPackage {
  status?: number;
  type: string;
  name: string;
  version: string;
  default: string;
  files: (JsdeliverFile | JsdeliverDirectory)[];
  links: JsdeliverLinks;
}
/**
 * unpakg directory处理
 */
export const jsdelivrDirectoryHandle = (res: (JsdeliverDirectory | JsdeliverFile)[], preName = "") => {
  return res.reduce((pre, cur) => {
    if (cur.type === "file") {
      pre.push({ name: `${preName}/${cur.name}` });
    } else if (cur.files) {
      pre.push(...jsdelivrDirectoryHandle(cur.files, `${preName}/${cur.name}`));
    }
    return pre;
  }, [] as FileNameRes["fileList"]);
};
function getFileList(packageName: string, version: string, doubleFind = false) {
  return new Promise<FileNameRes>((resolve, reject) => {
    if (!doubleFind && version.match(/^\D/)) {
      getSpecifierVersion(packageName, version).then((version) => {
        if (typeof version === "string") {
          getFileList(packageName, version, true).then(resolve, reject);
        } else {
          reject(new Error(`${packageName} ${version} not found`));
        }
      });
      return;
    }
    // /v1/stats/packages/npm/{package}@{version}/files
    req.get(
      `https://data.jsdelivr.com/v1/packages/npm/${packageName}@${version}`,
      (data: string) => {
        const res: JsdeliverPackage = JSON.parse(data);
        if (res.status) {
          reject(new Error(`${packageName}@${version} not found`));
          return;
        }
        resolve({ fileList: jsdelivrDirectoryHandle(res.files), version });
      },
      (e: unknown) => {
        reject(e);
      },
    );
  });
}
const getUrl = (packageName: string, version: string, fileName: string) => {
  // https://cdn.jsdelivr.net/npm/package@version/file
  return `https://cdn.jsdelivr.net/npm/${packageName}@${version}${fileName}`;
};
type SpecifierVersionRes = {
  type: string;
  name: string;
  version: string;
  links: {
    self: string;
    entrypoints: string;
    stats: string;
  };
};

const getSpecifierVersion = async (packageName: string, version: string) => {
  return await req.get(`https://data.jsdelivr.com/v1/packages/npm/${packageName}/resolved?specifier=${version}`).then(
    (data: string) => {
      const res: SpecifierVersionRes = JSON.parse(data);
      return res.version;
    },
    (e: unknown) => {
      return e;
    },
  );
};
const jsdelivrProcess: CdnUrlGeterrObj = {
  getFileList,
  // 拼接url
  getUrl,
};

export default jsdelivrProcess;
