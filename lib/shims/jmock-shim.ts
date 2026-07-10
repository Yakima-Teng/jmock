/* eslint-disable no-process-env */
/* eslint-disable no-sync */
import https from "node:https";
import fs from "node:fs";
import core from "union/lib/core";
import RoutingStream from "union/lib/routing-stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ServerOptions } from "node:https";

interface ShimOptions {
  before?: unknown[];
  after?: unknown[];
  buffer?: unknown;
  limit?: unknown;
  headers?: Record<string, string>;
  onError?: (
    err: Error,
    stream: unknown,
    target: unknown,
    next: () => void,
  ) => void;
  https?: {
    key?: string;
    cert?: string;
    ca?: string | string[];
    passphrase?: string;
  };
}

export default function (options: ShimOptions): https.Server {
  const isArray = Array.isArray(options.after);

  if (!options) {
    throw new Error("options is required to create a server");
  }

  function requestHandler(req: IncomingMessage, res: ServerResponse) {
    const routingStream = new RoutingStream({
      before: options.before,
      buffer: options.buffer,
      after:
        isArray &&
        options.after?.map(function (After) {
          return new (After as new () => unknown)();
        }),
      request: req,
      response: res,
      limit: options.limit,
      headers: options.headers,
    });

    routingStream.on("error", function (err: Error) {
      const fn = options.onError || core.errorHandler;
      fn(err, routingStream, routingStream.target, function () {
        routingStream.target.emit("next");
      });
    });

    req.pipe(routingStream);
  }

  const serverOptions = options.https!;
  if (!serverOptions.key || !serverOptions.cert) {
    throw new Error("Both options key and cert are required.");
  }

  const credentials: {
    key: string | Buffer;
    cert: string | Buffer;
    passphrase?: string;
    ca?: (string | Buffer)[];
  } = {
    key: fs.readFileSync(serverOptions.key).toString(),
    cert: fs.readFileSync(serverOptions.cert).toString(),
    passphrase: process.env.NODE_JMOCK_SSL_PASSPHRASE,
  };

  if (serverOptions.ca) {
    serverOptions.ca = !Array.isArray(serverOptions.ca)
      ? [serverOptions.ca]
      : serverOptions.ca;

    credentials.ca = (serverOptions.ca as string[]).map(function (ca) {
      return fs.readFileSync(ca).toString();
    });
  }

  return https.createServer(credentials as ServerOptions, requestHandler);
}
