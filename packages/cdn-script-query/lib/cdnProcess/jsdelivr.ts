import { NetworkError, NoVersionError, PackageNetworkError } from "../ErrorTypes";
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
async function getFileList(packageName: string, version: string, doubleFind = false) {
  try {
    if (!doubleFind && version.match(/^\D/)) {
      const specifierVersion = await getSpecifierVersion(packageName, version);
      if (typeof specifierVersion === "string") {
        return getFileList(packageName, specifierVersion, true);
      } else {
        throw new NoVersionError({
          packageName,
          version,
          cdn: "jsdelivr",
        });
      }
    }

    const res = await req.get<JsdeliverPackage>(`https://data.jsdelivr.com/v1/packages/npm/${packageName}@${version}`);
    if (res.status) {
      throw new NoVersionError({
        packageName,
        version,
        cdn: "jsdelivr",
      });
    }
    return { fileList: jsdelivrDirectoryHandle(res.files), version };
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new PackageNetworkError({
        packageName,
        version,
        cdn: "jsdelivr",
      });
    }
    throw error;
  }
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
  try {
    const res = await req.get<SpecifierVersionRes>(
      `https://data.jsdelivr.com/v1/packages/npm/${packageName}/resolved?specifier=${version}`,
    );
    return res.version;
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new PackageNetworkError({
        packageName,
        version,
        cdn: "jsdelivr",
      });
    }
    throw error;
  }
};

const jsdelivrProcess: CdnUrlGeterrObj = {
  getFileList,
  // 拼接url
  getUrl,
};

export default jsdelivrProcess;
