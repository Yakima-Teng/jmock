import fs from "node:fs";
import path from "node:path";
import type { Stats } from "node:fs";

type FileTuple = [string, Stats];

export default function sortByIsDirectory(
  dir: string,
  paths: string[],
  cb: (errs: FileTuple[], dirs: FileTuple[], files: FileTuple[]) => void,
): void {
  let pending = paths.length;
  const errs: FileTuple[] = [];
  const dirs: FileTuple[] = [];
  const files: FileTuple[] = [];

  if (!pending) {
    cb(errs, dirs, files);
    return;
  }

  for (const file of paths) {
    fs.stat(path.join(dir, file), (err, s) => {
      if (err) {
        errs.push([file, err as unknown as Stats]);
      } else if (s.isDirectory()) {
        dirs.push([file, s]);
      } else {
        files.push([file, s]);
      }

      pending -= 1;
      if (pending === 0) {
        cb(errs, dirs, files);
      }
    });
  }
}
