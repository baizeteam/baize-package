import { describe, expect, test } from "@jest/globals";
// Import the function to test
import { getLoadTagAndAttrStr } from "../lib/common";

describe("getLoadTagAndAttrStr", () => {
  test("should extract script tag with src attribute", () => {
    const html = `
      <html>
        <head>
          <script src="./scripts/app.js" async></script>
        </head>
      </html>
    `;
    const result = getLoadTagAndAttrStr(html);
    expect(result).toEqual([
      {
        tag: "script",
        src: "./scripts/app.js",
        attrStr: "  async",
      },
    ]);
  });

  test("should extract link tag with href attribute", () => {
    const html = `
      <html>
        <head>
          <link href="./styles/style.css" rel="stylesheet">
        </head>
      </html>
    `;
    const result = getLoadTagAndAttrStr(html);
    expect(result).toEqual([
      {
        tag: "link",
        src: "./styles/style.css",
        attrStr: '  rel="stylesheet"',
      },
    ]);
  });

  test("should handle multiple tags", () => {
    const html = `
      <html>
        <head>
          <script src="./scripts/app.js" async></script>
          <link href="./styles/style.css" rel="stylesheet">
          <script src="./scripts/utils.js" defer></script>
        </head>
      </html>
    `;
    const result = getLoadTagAndAttrStr(html);
    expect(result).toEqual([
      {
        tag: "script",
        src: "./scripts/app.js",
        attrStr: "  async",
      },
      {
        tag: "link",
        src: "./styles/style.css",
        attrStr: '  rel="stylesheet"',
      },
      {
        tag: "script",
        src: "./scripts/utils.js",
        attrStr: "  defer",
      },
    ]);
  });

  test("should ignore non-relative paths", () => {
    const html = `
      <html>
        <head>
          <script src="https://cdn.example.com/library.js"></script>
          <link href="/absolute/style.css" rel="stylesheet">
          <script src="./scripts/local.js"></script>
        </head>
      </html>
    `;
    const result = getLoadTagAndAttrStr(html);
    expect(result).toEqual([
      {
        tag: "link",
        src: "/absolute/style.css",
        attrStr: '  rel="stylesheet"',
      },
      {
        tag: "script",
        src: "./scripts/local.js",
        attrStr: " ",
      },
    ]);
  });

  test("should handle self-closing tags", () => {
    const html = `
      <html>
        <head>
          <link href="./styles/style.css" rel="stylesheet" />
        </head>
      </html>
    `;
    const result = getLoadTagAndAttrStr(html);
    expect(result).toEqual([
      {
        tag: "link",
        src: "./styles/style.css",
        attrStr: '  rel="stylesheet" ',
      },
    ]);
  });

  test("should return an empty array when no tags are found", () => {
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Test Page</title>
        </head>
      </html>
    `;
    const result = getLoadTagAndAttrStr(html);
    expect(result).toEqual([]);
  });

  test("should handle tags with complex attributes", () => {
    const html = `
      <html>
        <head>
          <script src="./scripts/app.js" type="text/javascript" async></script>
          <link href="./styles/style.css" rel="stylesheet" media="screen and (min-width: 900px)">
        </head>
      </html>
    `;
    const result = getLoadTagAndAttrStr(html);
    expect(result).toEqual([
      {
        tag: "script",
        src: "./scripts/app.js",
        attrStr: '  type="text/javascript" async',
      },
      {
        tag: "link",
        src: "./styles/style.css",
        attrStr: '  rel="stylesheet" media="screen and (min-width: 900px)"',
      },
    ]);
  });
});
