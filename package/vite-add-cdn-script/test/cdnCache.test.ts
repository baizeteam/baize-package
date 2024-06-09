import { describe, expect, it, jest } from "@jest/globals";
import { CdnCache } from "../lib/utils/cache";
import fs from "fs";

import path from "path";
import { MockFsType } from "../__mocks__/fs";
jest.mock("fs");

const mockFs: MockFsType = fs as any as MockFsType;
const cachePath = path.resolve(process.cwd(), "./.cdn-cache.json");

describe("cdn cache test", () => {
  const cdnCache = new CdnCache();

  it("init", async () => {
    await cdnCache.init();
    expect(cdnCache).toBeDefined();
  });

  it("set", () => {
    cdnCache.setCdnCache("react", "18.3.1", ["https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"]);
    expect(cdnCache.getCdnCache("react", "18.3.1")).toStrictEqual([
      "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
    ]);
  });

  it("get", () => {
    mockFs.__setMockFiles({
      [cachePath]: JSON.stringify({
        react: {
          "18.3.1": ["https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"],
        },
      }),
    });
    expect(cdnCache.getCdnCache("react", "18.3.1")).toStrictEqual([
      "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
    ]);
  });

  it("save", async () => {
    await cdnCache.save();
    expect(mockFs.__getMockFiles()[cachePath]).toBeDefined();
  });
});
