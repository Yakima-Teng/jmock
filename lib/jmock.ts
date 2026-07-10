import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import union from "union";
import jmockCore from "./core/index.ts";
import auth from "basic-auth";
import httpProxy from "http-proxy";
import corser from "corser";
import Mock from "mockjs";
import coBody from "co-body";
import secureCompare from "secure-compare";
import type { IncomingMessage, ServerResponse } from "node:http";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);

// Response extended with union.js emit method and json method
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

interface ProxyTableOptions {
  target?: string;
  changeOrigin?: boolean;
  pathRewrite?: (path: string, req: IncomingMessage) => string;
  proxyTimeout?: number;
  [key: string]: unknown;
}

interface MockTableHandler {
  (params: {
    req: IncomingMessage;
    method: string | undefined;
    query: unknown;
    body: unknown;
    Mock: typeof Mock;
  }): unknown;
}

interface JmockConfig {
  proxyTable?: Record<string, string | ProxyTableOptions>;
  mockTable?: Record<string, MockTableHandler>;
}

interface JmockOptions {
  root?: string;
  config?: boolean | string;
  cache?: number | string;
  timeout?: number;
  showDir?: boolean | string;
  autoIndex?: boolean | string;
  gzip?: boolean;
  brotli?: boolean;
  ext?: boolean | string;
  contentType?: string;
  logFn?: (req: IncomingMessage, res: ServerResponse, err?: Error) => void;
  username?: string;
  password?: string;
  cors?: boolean | string;
  corsHeaders?: string;
  robots?: boolean | string;
  mimetypes?: string;
  proxy?: string;
  proxyOptions?: Record<string, unknown>;
  https?: { cert: string; key: string; passphrase?: string };
  before?: ((req: IncomingMessage, res: ServerResponse) => void)[];
  headers?: Record<string, string>;
  showDotfiles?: boolean;
  [key: string]: unknown;
}

class Jmock {
  root: string;
  showDir: boolean | string;
  autoIndex: boolean | string;
  showDotfiles: boolean | undefined;
  gzip: boolean;
  brotli: boolean;
  ext: string | undefined;
  contentType: string;
  cache: number | string;
  headers: Record<string, string>;
  jmockConfig: JmockConfig | Record<string, never>;
  server: ReturnType<typeof union.createServer>;

  constructor(options: JmockOptions) {
    options = options || {};

    this.jmockConfig = {};
    const jmockConfigFileName = "jmock.config.mjs";
    const jmockConfigPath = path.join(process.cwd(), jmockConfigFileName);
    try {
      // eslint-disable-next-line no-sync
      fs.lstatSync("./" + jmockConfigFileName);
      this.jmockConfig = require(jmockConfigPath) as JmockConfig;
    } catch (err) {
      if (options.config === true) {
        // eslint-disable-next-line no-sync
        fs.copyFileSync(
          path.join(__dirname, "../" + jmockConfigFileName),
          jmockConfigPath,
        );
        this.jmockConfig = require(jmockConfigPath) as JmockConfig;
      }
    }
    const proxyTable = (this.jmockConfig as JmockConfig).proxyTable || {};
    const mockTable = (this.jmockConfig as JmockConfig).mockTable || {};

    if (options.root) {
      this.root = options.root;
    } else {
      try {
        // eslint-disable-next-line no-sync
        fs.lstatSync("./public");
        this.root = "./public";
      } catch (err) {
        this.root = "./";
      }
    }

    this.headers = options.headers || {};
    this.headers["Accept-Ranges"] = "bytes";

    this.cache =
      // eslint-disable-next-line no-nested-ternary
      typeof options.cache === "undefined"
        ? 3600
        : // -1 is a special case to turn off caching.
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#Preventing_caching
          options.cache === -1
          ? "no-cache, no-store, must-revalidate"
          : options.cache; // in seconds.
    this.showDir = options.showDir !== "false";
    this.autoIndex = options.autoIndex !== "false";
    this.showDotfiles = options.showDotfiles;
    this.gzip = options.gzip === true;
    this.brotli = options.brotli === true;
    if (options.ext) {
      this.ext = options.ext === true ? "html" : options.ext;
    }
    this.contentType =
      options.contentType || this.ext === "html"
        ? "text/html"
        : "application/octet-stream";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const before: any[] =
      options.before ? options.before.slice() : [];

    if (options.logFn) {
      before.push(function (req: IncomingMessage, res: ServerResponse) {
        options.logFn!(req, res);
        (res as Res).emit("next");
      });
    }

    if (options.username || options.password) {
      before.push(function (req: IncomingMessage, res: ServerResponse) {
        const credentials = auth(req);

        if (credentials) {
          const usernameEqual = secureCompare(
            options.username!.toString(),
            credentials.name,
          );
          const passwordEqual = secureCompare(
            options.password!.toString(),
            credentials.pass,
          );
          if (usernameEqual && passwordEqual) {
            return (res as Res).emit("next");
          }
        }

        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", 'Basic realm=""');
        res.end("Access denied");
      });
    }

    if (options.cors) {
      this.headers["Access-Control-Allow-Origin"] = "*";
      this.headers["Access-Control-Allow-Headers"] =
        "Origin, X-Requested-With, Content-Type, Accept, Range";
      if (options.corsHeaders) {
        options.corsHeaders.split(/\s*,\s*/).forEach((h) => {
          this.headers["Access-Control-Allow-Headers"] += ", " + h;
        });
      }
      before.push(
        corser.create(
          options.corsHeaders
            ? {
                requestHeaders:
                  this.headers["Access-Control-Allow-Headers"].split(/\s*,\s*/),
              }
            : null,
        ) as (req: IncomingMessage, res: ServerResponse) => void,
      );
    }

    if (options.robots) {
      before.push(function (req: IncomingMessage, res: ServerResponse) {
        if (req.url === "/robots.txt") {
          res.setHeader("Content-Type", "text/plain");
          const robots =
            options.robots === true
              ? "User-agent: *\nDisallow: /"
              : (options.robots as string).replace(/\\n/, "\n");

          return res.end(robots);
        }

        (res as Res).emit("next");
      });
    }

    before.push(
      jmockCore({
        root: this.root,
        cache: this.cache,
        showDir: this.showDir,
        showDotfiles: this.showDotfiles,
        autoIndex: this.autoIndex,
        defaultExt: this.ext,
        gzip: this.gzip,
        brotli: this.brotli,
        contentType: this.contentType,
        mimetypes: options.mimetypes,
        handleError:
          typeof options.proxy !== "string" &&
          Object.keys(proxyTable).length === 0 &&
          Object.keys(mockTable).length === 0,
      }),
    );

    if (Object.keys(mockTable).length > 0) {
      Object.keys(mockTable).forEach((context) => {
        const requestHandler = mockTable[context]!;
        if (typeof requestHandler !== "function") {
          return;
        }

        before.push(async function (req: IncomingMessage, res: ServerResponse) {
          if (!req.url!.startsWith(context)) {
            (res as Res).emit("next");
            return;
          }
          const callback = (body: unknown) => {
            const result = requestHandler({
              req,
              method: req.method,
              query: (req as IncomingMessage & { query?: unknown }).query,
              body,
              Mock,
            });
            if (result instanceof Promise) {
              result
                .then((resp) => {
                  res.statusCode = 200;
                  (res as Res).json(resp);
                })
                .catch((err) => {
                  // eslint-disable-next-line no-console
                  console.log(err);
                  res.statusCode = 500;
                  (res as Res).json({
                    code: 201,
                    data: null,
                    message: "There's something wrong.",
                  });
                });
              return;
            }
            res.statusCode = 200;
            (res as Res).json(result);
          };
          if (
            req.headers["content-type"] &&
            req.headers["content-type"].includes("application/json")
          ) {
            coBody.json(req).then((body: unknown) => {
              callback(body);
            });
            return;
          }
          callback({});
        });
      });
    }

    if (Object.keys(proxyTable).length > 0) {
      Object.keys(proxyTable).forEach((context) => {
        let rawOptions = proxyTable[context] as string | ProxyTableOptions;
        if (typeof rawOptions === "string") {
          rawOptions = { target: rawOptions };
        }

        const tempOptions: Record<string, unknown> = {};
        const eventHandlers: Record<string, Function> = {};
        Object.keys(rawOptions).forEach((key) => {
          const value = (rawOptions as Record<string, unknown>)[key];
          if (key.startsWith("on")) {
            eventHandlers[key] = value as Function;
          } else {
            tempOptions[key] = value;
          }
        });

        if (typeof tempOptions.proxyTimeout === "undefined") {
          tempOptions.proxyTimeout = 30000;
        }

        if (typeof eventHandlers.onProxyReq === "undefined") {
          eventHandlers.onProxyReq = (
            proxyReq: { path: string },
            req: IncomingMessage,
          ) => {
            const pathRewrite = (
              rawOptions as Record<string, unknown>
            ).pathRewrite;
            if (typeof pathRewrite === "function") {
              proxyReq.path = (
                pathRewrite as (path: string, req: IncomingMessage) => string
              )(proxyReq.path, req);
            }
          };
        }

        before.push(function (req: IncomingMessage, res: ServerResponse) {
          if (!req.url!.startsWith(context)) {
            (res as Res).emit("next");
            return;
          }
          const proxy = httpProxy.createProxyServer(tempOptions);
          Object.keys(eventHandlers).forEach((key) => {
            const eventName =
              key.substring(2, 3).toLowerCase() + key.substring(3);
            const eventHandler = eventHandlers[key];
            if (typeof eventHandler === "function") {
              proxy.on(eventName, eventHandler);
            }
          });

          proxy.web(
            req,
            res,
            {
              target: tempOptions.target as string,
              changeOrigin: true,
            },
            function (err: Error, req: IncomingMessage, res: ServerResponse) {
              if (options.logFn) {
                options.logFn(req, res, err);
              }
              (res as Res).emit("next");
            },
          );
        });
      });
    }

    if (typeof options.proxy === "string") {
      const proxyOptions = options.proxyOptions || {};
      const proxy = httpProxy.createProxyServer(proxyOptions);
      before.push(function (req: IncomingMessage, res: ServerResponse) {
        proxy.web(
          req,
          res,
          {
            target: options.proxy as string,
            changeOrigin: true,
          },
          function (err: Error, req: IncomingMessage, res: ServerResponse) {
            if (options.logFn) {
              options.logFn(req, res, err);
            }
            (res as Res).emit("next");
          },
        );
      });
    }

    const serverOptions: Record<string, unknown> = {
      buffer: false,
      before: before,
      headers: this.headers,
      onError: function (
        err: Error,
        req: IncomingMessage,
        res: ServerResponse,
      ) {
        if (options.logFn) {
          options.logFn(req, res, err);
        }
        res.end();
      },
    };

    if (options.https) {
      serverOptions.https = options.https;
    }

    this.server =
      serverOptions.https &&
      (serverOptions.https as { passphrase?: string }).passphrase
        ? // if passphrase is set, shim must be used as union does not support
          require("./shims/jmock-shim")(serverOptions)
        : union.createServer(serverOptions);

    if (typeof options.timeout !== "undefined") {
      this.server.setTimeout(options.timeout);
    }
  }

  listen(...args: unknown[]): void {
    this.server.listen.apply(this.server, args);
  }

  close(): void {
    return this.server.close();
  }
}

//
// Remark: backwards compatibility for previous
// case convention of HTTP
//
export { Jmock };
export const createServer = function (
  options: JmockOptions,
): Jmock {
  return new Jmock(options);
};
