// 引入path模块
import { jest } from "@jest/globals";

export type MockFsType = {
  readFileSync: (path: string) => string;
  writeFileSync: (path: string, data: string, encoding: string) => void;
  __setMockFiles: (newMockFiles: Record<string, string>) => void;
  __getMockFiles: () => Record<string, string>;
};

const fs: MockFsType = jest.createMockFromModule("fs") as jest.Mocked<typeof fs>;

let mockFiles: Record<string, string> = {};

function __setMockFiles(newMockFiles: Record<string, string>) {
  mockFiles = {};
  for (const file in newMockFiles) {
    if (!mockFiles[file]) {
      mockFiles[file] = "";
    }
    mockFiles[file] = newMockFiles[file];
  }
}

function __getMockFiles() {
  return mockFiles;
}
// readFileSync mock
function readFileSync(path: string) {
  return mockFiles[path] || "";
}

// writeFileSync mock
function writeFileSync(path: string, data: string, _encoding: string) {
  mockFiles[path] = data;
}

fs.__setMockFiles = __setMockFiles;
fs.__getMockFiles = __getMockFiles;

fs.readFileSync = readFileSync;
fs.writeFileSync = writeFileSync;

export default fs;
