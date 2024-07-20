import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConsoleManage } from "../lib";
const libName = "cdn-script";
describe("consoleManage", () => {
  const consoleManage = new ConsoleManage();
  beforeEach(() => {
    consoleManage.clear();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log messages", () => {
    consoleManage.log("test log");
    consoleManage.consoleAll();
    expect(console.log).toHaveBeenCalledWith(libName + " test log");
  });

  it("should warn messages", () => {
    consoleManage.warn("test warn");
    consoleManage.consoleAll();
    expect(console.warn).toHaveBeenCalledWith(libName + " test warn");
  });

  it("should error messages", () => {
    consoleManage.error("test error");
    consoleManage.consoleAll();
    expect(console.error).toHaveBeenCalledWith(libName + " test error");
  });

  it("should info messages", () => {
    consoleManage.info("test info");
    consoleManage.consoleAll();
    expect(console.info).toHaveBeenCalledWith(libName + " test info");
  });

  it("should clear messages", () => {
    consoleManage.log("test log");
    consoleManage.clear();
    consoleManage.consoleAll();
    expect(console.log).toHaveBeenCalled();
  });
});
