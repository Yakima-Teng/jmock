import type { Stats } from "node:fs";

export default function permsToString(stat: Stats): string {
  if (!stat.isDirectory || !stat.mode) {
    return "???!!!???";
  }

  const dir = stat.isDirectory() ? "d" : "-";
  const mode = stat.mode.toString(8);

  return (
    dir +
    mode
      .slice(-3)
      .split("")
      .map(
        (n) =>
          ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"][
            parseInt(n, 10)
          ],
      )
      .join("")
  );
}
