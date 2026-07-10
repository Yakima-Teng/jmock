import type { Stats } from "node:fs";

export default function sizeToString(
  stat: Stats,
  humanReadable: boolean,
  si: boolean,
): string {
  if (stat.isDirectory && stat.isDirectory()) {
    return "";
  }

  let bytes = stat.size;
  const threshold = si ? 1000 : 1024;

  if (!humanReadable || bytes < threshold) {
    return `${bytes}B`;
  }

  const units = ["k", "M", "G", "T", "P", "E", "Z", "Y"];
  let u = -1;
  do {
    bytes /= threshold;
    u += 1;
  } while (bytes >= threshold);

  const rounded = bytes.toFixed(1);
  const b = isNaN(Number(rounded)) ? "??" : rounded;

  return b + units[u];
}
