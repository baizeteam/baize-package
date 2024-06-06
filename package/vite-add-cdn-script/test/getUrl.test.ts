import { describe, expect, it, test } from "@jest/globals";
import { PropertyCdn } from "../lib/types";
import { cdnUrlGeterr, getPackageJsonByUrl, getPackageURL } from "../lib/utils";

// 获取真实的包地址
function getPackageFile(packageName: string, version: string) {
  return Promise.all(
    (["jsdelivr", "unpkg", "bootcdn", "cdnjs"] as PropertyCdn[]).map(async (cdn) => {
      const url = await getPackageURL(packageName, version, cdn);
      return url;
    }),
  );
}
// 拼接url
function concatURL(packageName: string, version: string, fileName: string) {
  return (["jsdelivr", "unpkg", "bootcdn", "cdnjs"] as PropertyCdn[]).map((cdn) => {
    const url = cdnUrlGeterr[cdn].getUrl(packageName, version, fileName);
    return url;
  });
}

describe("get package url truly", () => {
  test("get url truly", () => {
    expect(concatURL("react", "18.3.1", "/umd/react.production.min.js")).toStrictEqual([
      "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
      "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
      "https://cdn.bootcdn.net/ajax/libs/react/18.3.1/umd/react.production.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js",
    ]);
  });

  test("react 18.3.1 url", async () => {
    const react_18_3_1_urlList = await getPackageFile("react", "18.3.1");
    expect(react_18_3_1_urlList).toStrictEqual(concatURL("react", "18.3.1", "/umd/react.production.min.js"));
  }, 20000);

  test("vue 3.2.1 url", async () => {
    const vue_3_2_1_urlList = await getPackageFile("vue", "3.2.1");
    expect(vue_3_2_1_urlList).toStrictEqual([
      "https://cdn.jsdelivr.net/npm/vue@3.2.1/dist/vue.global.prod.js",
      "https://unpkg.com/vue@3.2.1/dist/vue.global.prod.js",
      "https://cdn.bootcdn.net/ajax/libs/vue/3.2.1/vue.global.prod.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.1/vue.global.prod.min.js",
    ]);
  }, 20000);

  test("getPackageJsonByUrl react-router-dom@6.23.1", async () => {
    const res = await getPackageJsonByUrl(
      "https://unpkg.com/react-router-dom@6.23.1/dist/umd/react-router-dom.production.min.js",
    );
    expect(res.dependencies).toBeDefined();
    expect(res.dependencies["@remix-run/router"]).toEqual("1.16.1");
    expect(res.dependencies["react-router"]).toEqual("6.23.1");
  });
  it("getPackageJsonByUrl throw not cdn url", async () => {
    const testUrl = "您吃了吗";
    await expect(getPackageJsonByUrl(testUrl)).rejects.toEqual(new Error(`${testUrl} 不是正确的url`));
  });
});
