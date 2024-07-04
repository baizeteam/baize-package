import { describe, expect, it, jest } from "@jest/globals";
import { CacheCellType, CdnCache } from "../lib/utils/cache";
import fs from "fs";

import path from "path";
import { MockFsType } from "../__mocks__/fs";
jest.mock("fs");

const mockFs: MockFsType = fs as any as MockFsType;
const cachePath = path.resolve(process.cwd(), "./.cdn-cache.json");
const react1831Cdn = [
  {
    success: true,
    url: "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
    cdnName: "jsdelivr",
  },
] as CacheCellType[];

describe("cdn cache test", () => {
  const cdnCache = new CdnCache();

  it("init", async () => {
    await cdnCache.init();
    expect(cdnCache).toBeDefined();
  });

  it("set", () => {
    cdnCache.setCdnCache("react", "18.3.1", react1831Cdn);
    expect(cdnCache.getCdnCache("react", "18.3.1")).toStrictEqual(react1831Cdn);
  });

  it("get", () => {
    mockFs.__setMockFiles({
      [cachePath]: JSON.stringify({
        react: {
          "18.3.1": react1831Cdn,
        },
      }),
    });
    expect(cdnCache.getCdnCache("react", "18.3.1")).toStrictEqual(react1831Cdn);
  });

  it("save", async () => {
    await cdnCache.save();
    expect(mockFs.__getMockFiles()[cachePath]).toBeDefined();
  });
});
