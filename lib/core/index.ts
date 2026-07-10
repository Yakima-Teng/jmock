import path from "node:path";
import fs from "node:fs";
import url from "node:url";
import { Readable } from "node:stream";
import buffer from "node:buffer";
import mime from "mime";
import urlJoin from "url-join";
import { getError, logError } from "nsuite";
import showDir from "./show-dir/index.ts";
import status from "./status-handlers.ts";
import generateEtag from "./etag.ts";
import optsParser from "./opts.ts";
import htmlEncodingSniffer from "html-encoding-sniffer";
import type { Stats } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";

interface MiddlewareOptions {
  root: string;
  cache?: string | number | ((pathname: string) => string | number);
  autoIndex?: boolean;
  baseDir?: string;
  defaultExt?: string;
  handleError?: boolean;
  headers?: Record<string, string | boolean>;
  weakEtags?: boolean;
  handleOptionsMethod?: boolean;
  gzip?: boolean;
  brotli?: boolean;
  contentType?: string;
  mimeTypes?: string | Record<string, string>;
  weakCompare?: boolean;
  humanReadable?: boolean;
  showDir?: boolean;
  showDotfiles?: boolean;
  si?: boolean;
  hidePermissions?: boolean;
  [key: string]: unknown;
}

type NextFn = () => void;

function decodePathname(pathname: string): string {
  const pieces = pathname.replace(/\\/g, "/").split("/");

  const normalized = path.normalize(
    pieces
      .map((rawPiece) => {
        const piece = decodeURIComponent(rawPiece);

        if (process.platform === "win32" && /\\/.test(piece)) {
          throw new Error("Invalid forward slash character");
        }

        return piece;
      })
      .join("/"),
  );
  return process.platform === "win32"
    ? normalized.replace(/\\/g, "/")
    : normalized;
}

function ensureUriEncoded(text: string): string {
  return text;
}

function shouldCompressGzip(req: IncomingMessage): boolean {
  const headers = req.headers;

  return (
    !!headers &&
    !!headers["accept-encoding"] &&
    String(headers["accept-encoding"])
      .split(",")
      .some(
        (el: string) =>
          ["*", "compress", "gzip", "deflate"].indexOf(el.trim()) !== -1,
      )
  );
}

function shouldCompressBrotli(req: IncomingMessage): boolean {
  const headers = req.headers;

  return (
    !!headers &&
    !!headers["accept-encoding"] &&
    String(headers["accept-encoding"])
      .split(",")
      .some((el: string) => ["*", "br"].indexOf(el.trim()) !== -1)
  );
}

function hasGzipId12(
  gzipped: string,
  cb: (err: Error | null, isGzip: boolean) => void,
): void {
  const stream = fs.createReadStream(gzipped, { start: 0, end: 1 });
  let buf = Buffer.from("");
  let hasBeenCalled = false;

  stream.on("data", (chunk) => {
    buf = Buffer.concat([buf, Buffer.from(chunk)], 2);
  });

  stream.on("error", (err) => {
    if (hasBeenCalled) {
      throw err;
    }

    hasBeenCalled = true;
    cb(err, false);
  });

  stream.on("close", () => {
    if (hasBeenCalled) {
      return;
    }

    hasBeenCalled = true;
    cb(null, buf[0] === 31 && buf[1] === 139);
  });
}

function createMiddleware(
  _dir: string | MiddlewareOptions,
  _options?: MiddlewareOptions,
) {
  let dir: string;
  let options: MiddlewareOptions;
  if (typeof _dir === "string") {
    dir = _dir;
    options = _options!;
  } else {
    options = _dir;
    dir = options.root!;
  }

  const root = path.join(path.resolve(dir), "/");
  const opts = optsParser(options as Parameters<typeof optsParser>[0]);
  const cache = opts.cache;
  const autoIndex = !!opts.autoIndex;
  const baseDir = opts.baseDir;
  let defaultExt = opts.defaultExt;
  const handleError = !!opts.handleError;
  const headers = (opts.headers || {}) as Record<string, string>;
  const weakEtags = !!opts.weakEtags;
  const handleOptionsMethod = !!opts.handleOptionsMethod;

  opts.root = dir;
  if (defaultExt && /^\./.test(defaultExt)) {
    defaultExt = defaultExt.replace(/^\./, "");
  }

  // Support hashes and .types files in mimeTypes @since 0.8
  if (opts.mimeTypes) {
    try {
      // You can pass a JSON blob here---useful for CLI use
      opts.mimeTypes = JSON.parse(opts.mimeTypes as string);
    } catch (err) {
      // swallow parse errors, treat this as a string mimetype input
      logError(`Error in parse mimeTypes: ${getError(err).message}`);
    }
    if (typeof opts.mimeTypes === "string") {
      mime.load(opts.mimeTypes);
    } else if (typeof opts.mimeTypes === "object") {
      mime.define(opts.mimeTypes as Record<string, string>);
    }
  }

  function shouldReturn304(
    req: IncomingMessage,
    serverLastModified: string,
    serverEtag: string,
  ): boolean {
    if (!req || !req.headers) {
      return false;
    }

    const clientModifiedSince = req.headers["if-modified-since"];
    const clientEtag = req.headers["if-none-match"];
    let clientModifiedDate: Date;

    if (!clientModifiedSince && !clientEtag) {
      return false;
    }

    if (clientModifiedSince) {
      try {
        clientModifiedDate = new Date(
          Date.parse(clientModifiedSince as string),
        );
      } catch (err) {
        logError(
          `Error in parse clientModifiedSince=${clientModifiedSince}: ${getError(err).message}`,
        );
        return false;
      }

      if (clientModifiedDate.toString() === "Invalid Date") {
        return false;
      }
      if (clientModifiedDate < new Date(serverLastModified)) {
        return false;
      }
    }

    if (clientEtag) {
      if (
        opts.weakCompare &&
        clientEtag !== serverEtag &&
        clientEtag !== `W/${serverEtag}` &&
        `W/${clientEtag}` !== serverEtag
      ) {
        return false;
      }
      if (
        !opts.weakCompare &&
        (clientEtag !== serverEtag || clientEtag.indexOf("W/") === 0)
      ) {
        return false;
      }
    }

    return true;
  }

  return function middleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: NextFn,
  ) {
    const parsed = url.parse(req.url || "", false);
    let pathname: string | null = null;
    let file: string | null = null;
    let gzippedFile: string | null = null;
    let brotliFile: string | null = null;

    try {
      decodeURIComponent(req.url || ""); // check validity of url
      pathname = decodePathname(parsed.pathname || "");
    } catch (err) {
      status[400](res, next, { error: err as Error });
      return;
    }

    file = path.normalize(
      path.join(root, path.relative(path.join("/", baseDir), pathname!)),
    );
    gzippedFile = `${file}.gz`;
    brotliFile = `${file}.br`;

    Object.keys(headers).forEach((key) => {
      res.setHeader(key, headers[key] as string);
    });

    if (req.method === "OPTIONS" && handleOptionsMethod) {
      res.end();
      return;
    }

    if (file!.slice(0, root.length) !== root) {
      status[403](res, next);
      return;
    }

    if (req.method && req.method !== "GET" && req.method !== "HEAD") {
      status[405](res, next);
      return;
    }

    function serve(stat: Stats) {
      const defaultType = opts.contentType || "application/octet-stream";
      let contentType = mime.lookup(file!, defaultType);
      const range = req.headers && req.headers.range;
      const lastModified = new Date(stat.mtime).toUTCString();
      const etag = generateEtag(stat, weakEtags);
      let cacheControl = cache;
      let stream: Readable | null = null;
      if (contentType && isTextFile(contentType)) {
        if (stat.size < buffer.constants.MAX_LENGTH) {
          const bytes = fs.readFileSync(file!);
          const sniffedEncoding = htmlEncodingSniffer(bytes, {
            defaultEncoding: "UTF-8",
          });
          contentType += `; charset=${sniffedEncoding}`;
          stream = Readable.from(bytes);
        } else {
          contentType += "; charset=UTF-8";
        }
      }

      if (file === gzippedFile) {
        res.setHeader("Content-Encoding", "gzip");
        contentType = mime.lookup(path.basename(file!, ".gz"), defaultType);
      } else if (file === brotliFile) {
        res.setHeader("Content-Encoding", "br");
        contentType = mime.lookup(path.basename(file!, ".br"), defaultType);
      }

      if (typeof cacheControl === "function") {
        cacheControl = (cache as (pathname: string) => string | number)(
          pathname!,
        );
      }
      if (typeof cacheControl === "number") {
        cacheControl = `max-age=${cacheControl}`;
      }

      if (range) {
        const total = stat.size;
        const parts = (range as string)
          .trim()
          .replace(/bytes=/, "")
          .split("-");
        const partialstart = parts[0];
        const partialend = parts[1];
        const start = parseInt(partialstart, 10);
        const end = Math.min(
          total - 1,
          partialend ? parseInt(partialend, 10) : total - 1,
        );
        const chunksize = end - start + 1;
        let fstream: fs.ReadStream | null = null;

        if (start > end || isNaN(start) || isNaN(end)) {
          status["416"](res, next);
          return;
        }

        fstream = fs.createReadStream(file!, { start, end });
        fstream.on("error", (err) => {
          status["500"](res, next, { error: err });
        });
        res.on("close", () => {
          fstream!.destroy();
        });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": contentType,
          "cache-control": cacheControl,
          "last-modified": lastModified,
          etag,
        });
        fstream.pipe(res);
        return;
      }

      res.setHeader("cache-control", cacheControl as string);
      res.setHeader("last-modified", lastModified);
      res.setHeader("etag", etag);

      if (shouldReturn304(req, lastModified, etag)) {
        status[304](res, next);
        return;
      }

      res.setHeader("content-length", stat.size);
      res.setHeader("content-type", contentType);

      res.statusCode =
        (req as IncomingMessage & { statusCode?: number }).statusCode || 200;

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      if (stream === null) {
        stream = fs.createReadStream(file!);
      }

      stream.pipe(res);
      stream.on("error", (err) => {
        status["500"](res, next, { error: err });
      });
      stream.on("close", () => {
        stream!.destroy();
      });
    }

    function statFile() {
      try {
        fs.stat(file!, (err, stat) => {
          if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
            if (
              (req as IncomingMessage & { statusCode?: number }).statusCode ===
              404
            ) {
              status[404](res, next);
            } else if (
              !path.extname(parsed.pathname || "").length &&
              defaultExt
            ) {
              middleware(
                {
                  url: `${parsed.pathname}.${defaultExt}${parsed.search ? parsed.search : ""}`,
                  headers: req.headers,
                } as IncomingMessage,
                res,
                next,
              );
            } else {
              const rawUrl = handleError
                ? `/${path.join(baseDir, `404.${defaultExt}`)}`
                : req.url;
              const encodedUrl = ensureUriEncoded(rawUrl || "");
              middleware(
                {
                  url: encodedUrl,
                  headers: req.headers,
                  statusCode: 404,
                } as IncomingMessage,
                res,
                next,
              );
            }
          } else if (err) {
            status[500](res, next, { error: err });
          } else if (stat.isDirectory()) {
            if (!autoIndex && !opts.showDir) {
              status[404](res, next);
              return;
            }

            if (!pathname!.match(/\/$/)) {
              res.statusCode = 302;
              const q = parsed.query ? `?${parsed.query}` : "";
              res.setHeader(
                "location",
                ensureUriEncoded(`${parsed.pathname}/${q}`),
              );
              res.end();
              return;
            }

            if (autoIndex) {
              middleware(
                {
                  url: urlJoin(
                    encodeURIComponent(pathname!),
                    `/index.${defaultExt}`,
                  ),
                  headers: req.headers,
                } as IncomingMessage,
                res,
                () => {
                  if (opts.showDir) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (showDir as any)(opts, stat)(req, res, () => {});
                    return;
                  }

                  status[403](res, next);
                },
              );
              return;
            }

            if (opts.showDir) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (showDir as any)(opts, stat)(req, res, () => {});
            }
          } else {
            serve(stat);
          }
        });
      } catch (err) {
        status[500](res, next, { error: (err as Error).message });
      }
    }

    function isTextFile(mimeType: string): boolean {
      return /^text\/|^application\/(javascript|json)/.test(mimeType);
    }

    function tryServeWithGzip() {
      try {
        fs.stat(gzippedFile!, (err, stat) => {
          if (!err && stat.isFile()) {
            hasGzipId12(gzippedFile!, (gzipErr, isGzip) => {
              if (!gzipErr && isGzip) {
                file = gzippedFile;
                serve(stat);
              } else {
                statFile();
              }
            });
          } else {
            statFile();
          }
        });
      } catch (err) {
        status[500](res, next, { error: (err as Error).message });
      }
    }

    function tryServeWithBrotli(shouldTryGzip: boolean) {
      try {
        fs.stat(brotliFile!, (err, stat) => {
          if (!err && stat.isFile()) {
            file = brotliFile;
            serve(stat);
          } else if (shouldTryGzip) {
            tryServeWithGzip();
          } else {
            statFile();
          }
        });
      } catch (err) {
        status[500](res, next, { error: (err as Error).message });
      }
    }

    const shouldTryBrotli = opts.brotli && shouldCompressBrotli(req);
    const shouldTryGzip = opts.gzip && shouldCompressGzip(req);
    if (shouldTryBrotli) {
      tryServeWithBrotli(shouldTryGzip);
    } else if (shouldTryGzip) {
      tryServeWithGzip();
    } else {
      statFile();
    }
  };
}

import pkg from "../../package.json" with { type: "json" };

createMiddleware.version = pkg.version;
createMiddleware.showDir = showDir;

export default createMiddleware;
