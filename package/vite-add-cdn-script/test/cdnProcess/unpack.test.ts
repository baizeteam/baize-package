import { describe, expect, test } from "@jest/globals";
import { getPackageURL } from "../../lib/utils";

describe("get package url truly", () => {
  test("test getPackageURL", async () => {
    expect(await getPackageURL("react", "~18.1", "unpkg")).toStrictEqual(
      "https://unpkg.com/react@~18.1/umd/react.production.min.js",
    );
  }, 20000);
});
