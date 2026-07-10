import defaults from "./defaults.json" with { type: "json" };
import aliases from "./aliases.json" with { type: "json" };

interface JmockOptions {
  autoIndex?: boolean;
  showDir?: boolean;
  showDotfiles?: boolean;
  humanReadable?: boolean;
  hidePermissions?: boolean;
  si?: boolean;
  cache?: string | number | ((pathname: string) => string | number);
  gzip?: boolean;
  brotli?: boolean;
  defaultExt?: string;
  handleError?: boolean;
  cors?: boolean | string;
  headers?: string | string[] | Record<string, string>;
  contentType?: string;
  mimeTypes?: string | Record<string, string>;
  weakEtags?: boolean;
  weakCompare?: boolean;
  handleOptionsMethod?: boolean;
  baseDir?: string;
  root?: string;
  [key: string]: unknown;
}

interface ParsedOptions {
  cache: string | number | ((pathname: string) => string | number);
  autoIndex: boolean;
  showDir: boolean;
  showDotfiles: boolean;
  humanReadable: boolean;
  hidePermissions: boolean;
  si: boolean;
  defaultExt: string;
  baseDir: string;
  gzip: boolean;
  brotli: boolean;
  handleError: boolean;
  headers: Record<string, string | boolean>;
  contentType: string;
  mimeTypes?: string | Record<string, string>;
  weakEtags: boolean;
  weakCompare: boolean;
  handleOptionsMethod: boolean;
  root?: string;
}

export default (opts?: JmockOptions): ParsedOptions => {
  let autoIndex = defaults.autoIndex;
  let showDir = defaults.showDir;
  let showDotfiles = defaults.showDotfiles;
  let humanReadable = defaults.humanReadable;
  let hidePermissions = defaults.hidePermissions;
  let si = defaults.si;
  let cache: string | number | ((pathname: string) => string | number) =
    defaults.cache;
  let gzip = defaults.gzip;
  let brotli = defaults.brotli;
  let defaultExt = defaults.defaultExt;
  let handleError = defaults.handleError;
  const headers: Record<string, string | boolean> = {};
  let contentType = defaults.contentType;
  let mimeTypes: string | Record<string, string> | undefined;
  let weakEtags = defaults.weakEtags;
  let weakCompare = defaults.weakCompare;
  let handleOptionsMethod = defaults.handleOptionsMethod;

  function isDeclared(k: string): boolean {
    return typeof opts![k] !== "undefined" && opts![k] !== null;
  }

  function setHeader(str: string): void {
    const m = /^(.+?)\s*:\s*(.*)$/.exec(str);
    if (!m) {
      headers[str] = true;
    } else {
      headers[m[1]] = m[2];
    }
  }

  if (opts) {
    aliases.autoIndex.some((k) => {
      if (isDeclared(k)) {
        autoIndex = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.showDir.some((k) => {
      if (isDeclared(k)) {
        showDir = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.showDotfiles.some((k) => {
      if (isDeclared(k)) {
        showDotfiles = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.humanReadable.some((k) => {
      if (isDeclared(k)) {
        humanReadable = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.hidePermissions.some((k) => {
      if (isDeclared(k)) {
        hidePermissions = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.si.some((k) => {
      if (isDeclared(k)) {
        si = opts![k] as boolean;
        return true;
      }
      return false;
    });

    if (opts.defaultExt && typeof opts.defaultExt === "string") {
      defaultExt = opts.defaultExt;
    }

    if (typeof opts.cache !== "undefined" && opts.cache !== null) {
      if (typeof opts.cache === "string") {
        cache = opts.cache;
      } else if (typeof opts.cache === "number") {
        cache = `max-age=${opts.cache}`;
      } else if (typeof opts.cache === "function") {
        cache = opts.cache;
      }
    }

    if (typeof opts.gzip !== "undefined" && opts.gzip !== null) {
      gzip = opts.gzip;
    }

    if (typeof opts.brotli !== "undefined" && opts.brotli !== null) {
      brotli = opts.brotli;
    }

    aliases.handleError.some((k) => {
      if (isDeclared(k)) {
        handleError = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.cors.forEach((k) => {
      if (isDeclared(k) && opts![k]) {
        handleOptionsMethod = true;
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Headers"] =
          "Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since";
      }
    });

    aliases.headers.forEach((k) => {
      if (isDeclared(k)) {
        const val = opts![k];
        if (Array.isArray(val)) {
          (val as string[]).forEach(setHeader);
        } else if (val && typeof val === "object") {
          Object.keys(val).forEach((key) => {
            headers[key] = (val as Record<string, string>)[key];
          });
        } else {
          setHeader(val as string);
        }
      }
    });

    aliases.contentType.some((k) => {
      if (isDeclared(k)) {
        contentType = opts![k] as string;
        return true;
      }
      return false;
    });

    aliases.mimeType.some((k) => {
      if (isDeclared(k)) {
        mimeTypes = opts![k] as string | Record<string, string>;
        return true;
      }
      return false;
    });

    aliases.weakEtags.some((k) => {
      if (isDeclared(k)) {
        weakEtags = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.weakCompare.some((k) => {
      if (isDeclared(k)) {
        weakCompare = opts![k] as boolean;
        return true;
      }
      return false;
    });

    aliases.handleOptionsMethod.some((k) => {
      if (isDeclared(k)) {
        handleOptionsMethod = handleOptionsMethod || (opts![k] as boolean);
        return true;
      }
      return false;
    });
  }

  return {
    cache,
    autoIndex,
    showDir,
    showDotfiles,
    humanReadable,
    hidePermissions,
    si,
    defaultExt,
    baseDir: (opts && opts.baseDir) || "/",
    gzip,
    brotli,
    handleError,
    headers,
    contentType,
    mimeTypes,
    weakEtags,
    weakCompare,
    handleOptionsMethod,
  };
};
