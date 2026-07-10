import type { Stats } from "node:fs";

export default function lastModifiedToString(stat: Stats): string {
  const t = new Date(stat.mtime);
  return (
    ("0" + t.getDate()).slice(-2) +
    "-" +
    t.toLocaleString("default", { month: "short" }) +
    "-" +
    t.getFullYear() +
    " " +
    ("0" + t.getHours()).slice(-2) +
    ":" +
    ("0" + t.getMinutes()).slice(-2)
  );
}
