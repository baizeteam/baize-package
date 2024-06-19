import { describe, expect, test } from "@jest/globals";
import { getPackageURL } from "../../lib/utils";

describe("get package url truly", () => {
  test("test getPackageURL", async () => {
    expect(await getPackageURL("react", "~18.1", "cdnjs")).toStrictEqual(
      "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js",
    );
  }, 100000);
});
