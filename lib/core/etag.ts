import type { Stats } from "node:fs";

export default (stat: Stats, weakEtag: boolean): string => {
  let etag = `"${[stat.ino, stat.size, stat.mtime.toISOString()].join("-")}"`;
  if (weakEtag) {
    etag = `W/${etag}`;
  }
  return etag;
};
