"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

describe("project structure", () => {
  const rootDir = path.join(__dirname, "..");

  it("project root exists", () => {
    assert.ok(fs.existsSync(rootDir), "project root exists");
  });

  it("package.json exists", () => {
    assert.ok(
      fs.existsSync(path.join(rootDir, "package.json")),
      "package.json exists",
    );
  });

  it("lib directory exists", () => {
    assert.ok(fs.existsSync(path.join(rootDir, "lib")), "lib directory exists");
  });

  it("bin directory exists", () => {
    assert.ok(fs.existsSync(path.join(rootDir, "bin")), "bin directory exists");
  });
});

describe("jmock module loads", () => {
  it("jmock module loads without error", () => {
    assert.doesNotThrow(() => {
      require("../lib/jmock");
    }, "jmock module loads without error");
  });
});

describe("config loads", () => {
  it("jmock.config loads without error", () => {
    assert.doesNotThrow(() => {
      require("../jmock.config");
    }, "jmock.config loads without error");
  });
});
