import * as glob from "glob";
import fs from "node:fs";
import path from "node:path";
import { loadTagAndAttrStrType } from "./common";
import { generateScript } from "./generateScript";

/**
 *  上传静态资源文件
 * @param param0  参数
 *  - outDirPath  输出目录
 *  - uploadIgnore 上传忽略
 *  - loadTagAndAttrss 主js名字
 *  - uploadFiles 上传文件
 * @returns {Promise<void>}
 */
export async function uploadAssetsFiles({
  outDirPath,
  uploadIgnore,
  loadTagAndAttrs,
  uploadFiles,
}: {
  outDirPath: string;
  uploadIgnore?: string;
  uploadFiles: (filePath: string, info: {}) => string | Promise<string>;
  loadTagAndAttrs: loadTagAndAttrStrType[];
}) {
  const files = glob.sync(path.join(outDirPath, "**/*"), {
    nodir: true,
    dot: true,
    ignore: uploadIgnore || "**/*.html",
  });
  const upLoadRes = await Promise.all(
    files.map(async (file) => ({
      ossPath: await uploadFiles(file, {}),
      fileName: file.slice(outDirPath.length + 1),
    })),
  );
  // 替换本地文件名
  const htmlFilePath = glob.sync(path.join(outDirPath, "**/*.html"), {
    nodir: true,
    dot: true,
  });
  if (htmlFilePath.length === 0) return;
  let uploadResLoadTag: Parameters<typeof generateScript>[0] = [];
  for (const htmlFile of htmlFilePath) {
    if (files.includes(htmlFile)) {
      continue;
    }
    let html = fs.readFileSync(htmlFile, "utf-8");
    for (const loadTagAndAttr of loadTagAndAttrs) {
      const findItem = upLoadRes.find((item) => loadTagAndAttr.src.includes(item.fileName));
      if (!findItem) continue;

      html = html.replace(
        new RegExp(`<(\\w+)\\b.*${loadTagAndAttr.src.replace(/([\.|\/])/g, "\\$1")}[^>]*(?:\/>|>[*<]*<\/\\w+>|>)`, "g"),
        "",
      );

      uploadResLoadTag.push({
        key: loadTagAndAttr.src,
        tag: loadTagAndAttr.tag,
        urls: [findItem.ossPath, loadTagAndAttr.src],
        attrStr: loadTagAndAttr.attrStr,
      });
    }
    html = html.replace("</head>", `${generateScript(uploadResLoadTag)}</head>`);
    fs.writeFileSync(htmlFile, html);
  }
}
