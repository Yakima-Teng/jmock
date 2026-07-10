// Type declarations for CJS dependencies without types
declare module "basic-auth";
declare module "co-body";
declare module "corser";
declare module "he";
declare module "html-encoding-sniffer";
declare module "http-proxy";
declare module "mime";
declare module "minimist";
declare module "mockjs";
declare module "opener";
declare module "portfinder";
declare module "secure-compare";
declare module "union";
declare module "union/lib/core";
declare module "union/lib/routing-stream";
declare module "url-join";

// Config module used in tests
declare module "*.mjs" {
  const value: unknown;
  export default value;
}
