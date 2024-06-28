import { describe, expect, test } from "@jest/globals";
import { getPackageURL } from "../../lib/utils";

describe("get package url truly", () => {
  test("test getPackageURL", async () => {
    expect(await getPackageURL("react", "^18.1", "jsdelivr")).toStrictEqual(
      "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
    );
    expect(await getPackageURL("react", "~18.1", "jsdelivr")).toStrictEqual(
      "https://cdn.jsdelivr.net/npm/react@18.1.0/umd/react.production.min.js",
    );
  }, 20000);
});
