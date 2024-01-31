'use strict';

var fs = require('fs'),
  path = require('path'),
  union = require('union'),
  jmockCore = require('./core'),
  auth = require('basic-auth'),
  httpProxy = require('http-proxy'),
  corser = require('corser'),
  Mock = require('mockjs'),
  coBody = require('co-body'),
  secureCompare = require('secure-compare');

//
// Remark: backwards compatibility for previous
// case convention of HTTP
//
exports.Jmock = exports.Jmock = Jmock;

/**
 * Returns a new instance of Jmock with the
 * specified `options`.
 */
exports.createServer = function (options) {
  return new Jmock(options);
};

/**
 * Constructor function for the Jmock object
 * which is responsible for serving static files along
 * with other HTTP-related features.
 */
function Jmock(options) {
  options = options || {};

  this.jmockConfig = {}
  const jmockConfigFileName = 'jmock.config.js'
  try {
    // eslint-disable-next-line no-sync
    fs.lstatSync('./' + jmockConfigFileName);
    const jmockConfigPath = path.join(process.cwd(), jmockConfigFileName)
    this.jmockConfig = require(jmockConfigPath)
  } catch (err) {
    if (options.config === true) {
      // eslint-disable-next-line no-sync
      fs.copyFileSync(
          path.join(__dirname, '../' + jmockConfigFileName),
          './' + jmockConfigFileName
      )
    }
  }
  const proxyTable = this.jmockConfig.proxyTable || {}
  const mockTable = this.jmockConfig.mockTable || {}

  if (options.root) {
    this.root = options.root;
  } else {
    try {
      // eslint-disable-next-line no-sync
      fs.lstatSync('./public');
      this.root = './public';
    } catch (err) {
      this.root = './';
    }
  }

  this.headers = options.headers || {};
  this.headers['Accept-Ranges'] = 'bytes';

  this.cache = (
    // eslint-disable-next-line no-nested-ternary
    options.cache === undefined ? 3600 :
    // -1 is a special case to turn off caching.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#Preventing_caching
      options.cache === -1 ? 'no-cache, no-store, must-revalidate' :
        options.cache // in seconds.
  );
  this.showDir = options.showDir !== 'false';
  this.autoIndex = options.autoIndex !== 'false';
  this.showDotfiles = options.showDotfiles;
  this.gzip = options.gzip === true;
  this.brotli = options.brotli === true;
  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }
  this.contentType = options.contentType ||
    this.ext === 'html' ? 'text/html' : 'application/octet-stream';

  var before = options.before ? options.before.slice() : [];

  if (options.logFn) {
    before.push(function (req, res) {
      options.logFn(req, res);
      res.emit('next');
    });
  }

  if (options.username || options.password) {
    before.push(function (req, res) {
      var credentials = auth(req);

      // We perform these outside the if to avoid short-circuiting and giving
      // an attacker knowledge of whether the username is correct via a timing
      // attack.
      if (credentials) {
        // if credentials is defined, name and pass are guaranteed to be string
        // type
        var usernameEqual = secureCompare(options.username.toString(), credentials.name);
        var passwordEqual = secureCompare(options.password.toString(), credentials.pass);
        if (usernameEqual && passwordEqual) {
          return res.emit('next');
        }
      }

      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm=""');
      res.end('Access denied');
    });
  }

  if (options.cors) {
    this.headers['Access-Control-Allow-Origin'] = '*';
    this.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
    if (options.corsHeaders) {
      options.corsHeaders.split(/\s*,\s*/)
        .forEach(function (h) { this.headers['Access-Control-Allow-Headers'] += ', ' + h; }, this);
    }
    before.push(corser.create(options.corsHeaders ? {
      requestHeaders: this.headers['Access-Control-Allow-Headers'].split(/\s*,\s*/)
    } : null));
  }

  if (options.robots) {
    before.push(function (req, res) {
      if (req.url === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain');
        var robots = options.robots === true
          ? 'User-agent: *\nDisallow: /'
          : options.robots.replace(/\\n/, '\n');

        return res.end(robots);
      }

      res.emit('next');
    });
  }

  before.push(jmockCore({
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
        typeof options.proxy !== 'string' &&
        Object.keys(proxyTable).length === 0 &&
        Object.keys(mockTable).length === 0
  }));

  if (Object.keys(mockTable).length > 0) {
    Object.keys(mockTable).forEach((context) => {
      const requestHandler = mockTable[context]
      if (typeof requestHandler !== 'function') {
        return
      }

      before.push(async function (req, res) {
        if (!req.url.startsWith(context)) {
          res.emit('next')
          return
        }
        const callback = (body) => {
          const result = requestHandler({
            req,
            method: req.method,
            query: req.query,
            body,
            Mock,
          })
          if (result instanceof Promise) {
            result.then((resp) => {
              res.statusCode = 200
              res.json(resp)
            }).catch((err) => {
              // eslint-disable-next-line no-console
              console.log(err)
              res.statusCode = 500
              res.json({
                code: 201,
                data: null,
                message: 'There\'s something wrong.',
              })
            })
            return
          }
          res.statusCode = 200
          res.json(result)
        }
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
          coBody.json(req).then((body) => {
            callback(body)
          })
          return
        }
        callback({})
      });
    })
  }

  if (Object.keys(proxyTable).length > 0) {
    Object.keys(proxyTable).forEach((context) => {
      let rawOptions = proxyTable[context]
      if (typeof rawOptions === 'string') {
        rawOptions = { target: rawOptions }
      }

      const tempOptions = {}
      const eventHandlers = {}
      Object.keys(rawOptions).forEach((key) => {
        const value = rawOptions[key]
        // key starts with `on` is event handler functions
        if (key.startsWith('on')) {
          eventHandlers[key] = value
        } else {
          tempOptions[key] = value
        }
      })

      if (typeof tempOptions.proxyTimeout === 'undefined') {
        // 30ms is enough for most cases
        tempOptions.proxyTimeout = 30000
      }

      if (typeof eventHandlers.onProxyReq === 'undefined') {
        eventHandlers.onProxyReq = (proxyReq, req, res, options) => {
          const pathRewrite = rawOptions.pathRewrite
          if (typeof pathRewrite === 'function') {
            proxyReq.path = pathRewrite(proxyReq.path, req)
          }
        }
      }

      before.push(function (req, res) {
        if (!req.url.startsWith(context)) {
          res.emit('next')
          return
        }
        // https://www.npmjs.com/package/http-proxy#core-concept
        const proxy = httpProxy.createProxyServer(tempOptions)
        // for details, please visit: https://www.npmjs.com/package/http-proxy#listening-for-proxy-events
        Object.keys(eventHandlers).forEach((key) => {
          const eventName = key.substring(2, 3).toLowerCase() + key.substring(3)
          const eventHandler = eventHandlers[key]
          if (typeof eventHandler === 'function') {
            proxy.on(eventName, eventHandler)
          }
        })

        proxy.web(req, res, {
          target: tempOptions.target,
          changeOrigin: true
        }, function (err, req, res) {
          // this callback is for error case
          if (options.logFn) {
            options.logFn(req, res, {
              message: err.message,
              status: res.statusCode });
          }
          res.emit('next');
        });
      });
    })
  }

  if (typeof options.proxy === 'string') {
    var proxyOptions = options.proxyOptions || {};
    var proxy = httpProxy.createProxyServer(proxyOptions);
    before.push(function (req, res) {
      proxy.web(req, res, {
        target: options.proxy,
        changeOrigin: true
      }, function (err, req, res) {
        if (options.logFn) {
          options.logFn(req, res, {
            message: err.message,
            status: res.statusCode });
        }
        res.emit('next');
      });
    });
  }

  var serverOptions = {
    // if buffer is not set to false, co-body will not make effect, because req.on('data', cb) will not be triggered
    buffer: false,
    before: before,
    headers: this.headers,
    onError: function (err, req, res) {
      if (options.logFn) {
        options.logFn(req, res, err);
      }

      res.end();
    }
  };

  if (options.https) {
    serverOptions.https = options.https;
  }

  this.server = serverOptions.https && serverOptions.https.passphrase
    // if passphrase is set, shim must be used as union does not support
    ? require('./shims/jmock-shim')(serverOptions)
    : union.createServer(serverOptions);

  if (options.timeout !== undefined) {
    this.server.setTimeout(options.timeout);
  }
}

Jmock.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

Jmock.prototype.close = function () {
  return this.server.close();
};
