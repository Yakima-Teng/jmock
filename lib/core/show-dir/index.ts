import { icons as supportedIcons, css } from "./styles.ts";
import lastModifiedToString from "./last-modified-to-string.ts";
import permsToString from "./perms-to-string.ts";
import sizeToString from "./size-to-string.ts";
import sortFiles from "./sort-files.ts";
import fs from "node:fs";
import path from "node:path";
import he from "he";
import generateEtag from "../etag.ts";
import url from "node:url";
import status from "../status-handlers.ts";
import type { Stats } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";

type NextFn = () => void;

interface ShowDirOptions {
  cache: string | number | ((pathname: string) => string | number);
  root?: string;
  baseDir: string;
  humanReadable: boolean;
  hidePermissions: boolean;
  handleError: boolean;
  showDotfiles: boolean;
  si: boolean;
  weakEtags: boolean;
}

export default (opts: ShowDirOptions) => {
  const cache = opts.cache;
  const root = path.resolve(opts.root || "");
  const baseDir = opts.baseDir;
  const humanReadable = opts.humanReadable;
  const hidePermissions = opts.hidePermissions;
  const handleError = opts.handleError;
  const showDotfiles = opts.showDotfiles;
  const si = opts.si;
  const weakEtags = opts.weakEtags;

  return function middleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: NextFn,
  ) {
    const parsed = url.parse(req.url || "", false);
    const pathname = decodeURIComponent(parsed.pathname || "");
    const dir = path.normalize(
      path.join(root, path.relative(path.join("/", baseDir), pathname)),
    );

    fs.stat(dir, (statErr, stat) => {
      if (statErr) {
        if (handleError) {
          status[500](res, next, { error: statErr });
          return;
        }
        next();
        return;
      }

      fs.readdir(dir, (readErr, _files) => {
        let files = _files;

        if (readErr) {
          if (handleError) {
            status[500](res, next, { error: readErr });
            return;
          }
          next();
          return;
        }

        if (!showDotfiles) {
          files = files.filter((filename) => filename.slice(0, 1) !== ".");
        }

        res.setHeader("content-type", "text/html");
        res.setHeader("etag", generateEtag(stat, weakEtags));
        res.setHeader("last-modified", new Date(stat.mtime).toUTCString());
        res.setHeader("cache-control", cache as string);

        function render(
          dirs: [string, Stats][],
          renderFiles: [string, Stats][],
          lolwuts: [string, Stats][],
        ) {
          let html = `${[
            "<!doctype html>",
            "<html>",
            "  <head>",
            '    <meta charset="utf-8">',
            '    <meta name="viewport" content="width=device-width">',
            `    <title>Index of ${he.encode(pathname)}</title>`,
            `    <style type="text/css">${css}</style>`,
            "  </head>",
            "  <body>",
            `<h1>Index of ${he.encode(pathname)}</h1>`,
          ].join("\n")}\n`;

          html += "<table>";

          const failed = false;
          const writeRow = (file: [string, Stats]) => {
            const name = file[0];
            const statEntry = file[1];
            const isDir = statEntry?.isDirectory() ?? false;
            let href = `./${encodeURIComponent(name)}`;

            if (isDir) {
              href += `/${he.encode(parsed.search ? parsed.search : "")}`;
            }

            const displayName = he.encode(name) + (isDir ? "/" : "");
            const ext = name.split(".").pop() || "";
            const classForNonDir = supportedIcons[
              ext as keyof typeof supportedIcons
            ]
              ? ext
              : "_page";
            const iconClass = `icon-${isDir ? "_blank" : classForNonDir}`;

            html += `<tr><td><i class="icon ${iconClass}"></i></td>`;
            if (!hidePermissions && statEntry) {
              html += `<td class="perms"><code>(${permsToString(statEntry)})</code></td>`;
            }
            html +=
              `<td class="last-modified">${
                statEntry ? lastModifiedToString(statEntry) : ""
              }</td>` +
              `<td class="file-size"><code>${
                statEntry ? sizeToString(statEntry, humanReadable, si) : ""
              }</code></td>` +
              `<td class="display-name"><a href="${href}">${displayName}</a></td>` +
              "</tr>\n";
          };

          dirs
            .sort((a, b) => a[0].toString().localeCompare(b[0].toString()))
            .forEach(writeRow);
          renderFiles
            .sort((a, b) => a.toString().localeCompare(b.toString()))
            .forEach(writeRow);
          lolwuts
            .sort((a, b) => a[0].toString().localeCompare(b[0].toString()))
            .forEach(writeRow);

          html += "</table>\n";
          html +=
            `<br><address>Node.js ${
              process.version
            }/ <a href="https://github.com/Yakima-Teng/jmock">http-server</a> ` +
            `server running @ ${he.encode(
              req.headers.host || "",
            )}</address>\n` +
            "</body></html>";

          if (!failed) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
          }
        }

        sortFiles(dir, files, (lolwuts, dirs, sortedFiles) => {
          if (path.resolve(dir, "..").slice(0, root.length) === root) {
            fs.stat(path.join(dir, ".."), (err, s) => {
              if (err) {
                if (handleError) {
                  status[500](res, next, { error: err });
                  return;
                }
                next();
                return;
              }
              dirs.unshift(["..", s]);
              render(dirs, sortedFiles, lolwuts);
            });
          } else {
            render(dirs, sortedFiles, lolwuts);
          }
        });
      });
    });
  };
};
