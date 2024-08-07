import * as glob from "glob";
import fs from "node:fs";
import path from "node:path";

/**
 *  上传静态资源文件
 * @param param0  参数
 *  - outDirPath  输出目录
 *  - uploadIgnore 上传忽略
 *  - mainJsNames 主js名字
 *  - uploadFiles 上传文件
 * @returns {Promise<void>}
 */
export async function uploadAssetsFiles({
  outDirPath,
  uploadIgnore,
  mainJsNames,
  uploadFiles,
}: {
  outDirPath: string;
  uploadIgnore?: string;
  uploadFiles: (filePath: string, info: {}) => string | Promise<string>;
  mainJsNames: string[];
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
  for (const htmlFile of htmlFilePath) {
    if (files.includes(htmlFile)) {
      continue;
    }
    let html = fs.readFileSync(htmlFile, "utf-8");
    for (const mainJsName of mainJsNames) {
      const find = upLoadRes.find((item) => mainJsName.includes(item.fileName));
      if (!find) continue;
      html = html.replace(mainJsName, find.ossPath);
    }
    fs.writeFileSync(htmlFile, html);
  }
}
