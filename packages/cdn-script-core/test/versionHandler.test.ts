import { describe, expect, it } from "@jest/globals";
import { compareVersion, composeVersionObj } from "../lib/versionHandler";

describe("compareVersion", () => {
  it("should return 0 when versions are equal", () => {
    expect(compareVersion("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersion("1.01.0", "1.1.0")).toBe(0);
  });

  it("should return 1 when the first version is greater", () => {
    expect(compareVersion("1.1.0", "1.0.0")).toBe(1);
    expect(compareVersion("1.0.1", "1.0.0")).toBe(1);
    expect(compareVersion("2.0.0", "1.9.9")).toBe(1);
  });

  it("should return -1 when the second version is greater", () => {
    expect(compareVersion("1.0.0", "1.1.0")).toBe(-1);
    expect(compareVersion("1.0.0", "1.0.1")).toBe(-1);
    expect(compareVersion("1.9.9", "2.0.0")).toBe(-1);
  });

  it("should handle versions with different lengths", () => {
    expect(compareVersion("1.0", "1.0.0")).toBe(0);
    expect(compareVersion("1", "1.0.0")).toBe(0);
    expect(compareVersion("1.0.1", "1.0")).toBe(1);
    expect(compareVersion("1.0", "1.0.1")).toBe(-1);
  });
});

describe("composeVersionObj", () => {
  it("should merge dependencies correctly", () => {
    const beComposedObj = {
      packageA: "1.0.0",
      packageB: "2.0.0",
    };
    const dependencies = {
      packageA: "1.1.0",
      packageB: "1.5.0",
      packageC: "1.0.0",
    };
    const expected = {
      packageA: "1.1.0",
      packageB: "2.0.0",
      packageC: "1.0.0",
    };
    expect(composeVersionObj(beComposedObj, dependencies)).toEqual(expected);
  });

  it("should not change the object if all versions are lower or equal", () => {
    const beComposedObj = {
      packageA: "1.1.0",
      packageB: "2.0.0",
    };
    const dependencies = {
      packageA: "1.0.0",
      packageB: "2.0.0",
    };
    const expected = {
      packageA: "1.1.0",
      packageB: "2.0.0",
    };
    expect(composeVersionObj(beComposedObj, dependencies)).toEqual(expected);
  });

  it("should add new packages from dependencies", () => {
    const beComposedObj = {
      packageA: "1.1.0",
    };
    const dependencies = {
      packageA: "1.0.0",
      packageB: "2.0.0",
    };
    const expected = {
      packageA: "1.1.0",
      packageB: "2.0.0",
    };
    expect(composeVersionObj(beComposedObj, dependencies)).toEqual(expected);
  });
});
