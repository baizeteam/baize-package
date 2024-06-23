import ConsoleManage from "../lib/utils/consoleManage";
import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

describe("ConsoleManage", () => {
  beforeEach(() => {
    ConsoleManage.clear();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log messages", () => {
    ConsoleManage.log("test log");
    ConsoleManage.consoleAll();
    expect(console.log).toHaveBeenCalledWith("test log");
  });

  it("should warn messages", () => {
    ConsoleManage.warn("test warn");
    ConsoleManage.consoleAll();
    expect(console.warn).toHaveBeenCalledWith("test warn");
  });

  it("should error messages", () => {
    ConsoleManage.error("test error");
    ConsoleManage.consoleAll();
    expect(console.error).toHaveBeenCalledWith("test error");
  });

  it("should info messages", () => {
    ConsoleManage.info("test info");
    ConsoleManage.consoleAll();
    expect(console.info).toHaveBeenCalledWith("test info");
  });

  it("should clear messages", () => {
    ConsoleManage.log("test log");
    ConsoleManage.clear();
    ConsoleManage.consoleAll();
    expect(console.log).not.toHaveBeenCalled();
  });
});
