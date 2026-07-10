import he from "he";
import type { ServerResponse } from "node:http";
import { getError, logError } from "nsuite";

type NextFn = () => void;

export function handle304(res: ServerResponse): void {
  res.statusCode = 304;
  res.end();
}

export function handle403(res: ServerResponse, next?: NextFn): void {
  res.statusCode = 403;
  if (typeof next === "function") {
    next();
    return;
  }
  if (res.writable) {
    res.setHeader("content-type", "text/plain");
    res.end("ACCESS DENIED");
  }
}

export function handle405(
  res: ServerResponse,
  next?: NextFn,
  opts?: { allow?: string },
): void {
  res.statusCode = 405;
  if (typeof next === "function") {
    next();
    return;
  }
  res.setHeader("allow", (opts && opts.allow) || "GET, HEAD");
  res.end();
}

export function handle404(res: ServerResponse, next?: NextFn): void {
  res.statusCode = 404;
  if (typeof next === "function") {
    next();
    return;
  }
  if (res.writable) {
    res.setHeader("content-type", "text/plain");
    res.end("File not found. :(");
  }
}

export function handle416(res: ServerResponse, next?: NextFn): void {
  res.statusCode = 416;
  if (typeof next === "function") {
    next();
    return;
  }
  if (res.writable) {
    res.setHeader("content-type", "text/plain");
    res.end("Requested range not satisfiable");
  }
}

export function handle500(
  res: ServerResponse,
  next?: NextFn,
  opts?: { error: Error | string },
): void {
  res.statusCode = 500;
  try {
    res.setHeader("content-type", "text/html");
  } catch (err) {
    // errors may have triggered headers being sent already
    logError(
      `Error setHeader "content-type" to be "text/html": ${getError(err).message}`,
    );
  }
  const error = String(
    (opts && opts.error && (opts.error as Error).stack) ||
      (opts && opts.error) ||
      "No specified error",
  );
  const html = `${[
    "<!doctype html>",
    "<html>",
    "  <head>",
    '    <meta charset="utf-8">',
    "    <title>500 Internal Server Error</title>",
    "  </head>",
    "  <body>",
    "    <p>",
    `      ${he.encode(error)}`,
    "    </p>",
    "  </body>",
    "</html>",
  ].join("\n")}\n`;
  res.end(html);
}

export function handle400(
  res: ServerResponse,
  next?: NextFn,
  opts?: { error?: Error | string },
): void {
  res.statusCode = 400;
  res.setHeader("content-type", "text/html");
  const error = opts && opts.error ? String(opts.error) : "Malformed request.";
  const html = `${[
    "<!doctype html>",
    "<html>",
    "  <head>",
    '    <meta charset="utf-8">',
    "    <title>400 Bad Request</title>",
    "  </head>",
    "  <body>",
    "    <p>",
    `      ${he.encode(error)}`,
    "    </p>",
    "  </body>",
    "</html>",
  ].join("\n")}\n`;
  res.end(html);
}

const status: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]) => void
> = {
  "304": handle304,
  "400": handle400,
  "403": handle403,
  "404": handle404,
  "405": handle405,
  "416": handle416,
  "500": handle500,
};

export default status;
