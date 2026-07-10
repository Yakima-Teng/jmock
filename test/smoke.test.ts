import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

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
  it("jmock module loads without error", async () => {
    assert.doesNotThrow(async () => {
      await import("../lib/jmock.ts");
    }, "jmock module loads without error");
  });
});

describe("config loads", () => {
  it("jmock.config loads without error", async () => {
    assert.doesNotThrow(async () => {
      await import("../jmock.config.mjs");
    }, "jmock.config loads without error");
  });
});
