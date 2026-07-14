# jmock

<p align="center" style="display: flex;align-items: center;justify-content: center;gap:8px;">
  <a href="https://npmcharts.com/compare/jmock?minimal=true">
    <img src="https://img.shields.io/npm/dm/jmock.svg" alt="Downloads">
  </a>
  <a href="https://www.npmjs.com/package/jmock">
    <img src="https://img.shields.io/npm/v/jmock.svg" alt="Version">
  </a>
  <a href="https://www.npmjs.com/package/jmock">
    <img src="https://img.shields.io/npm/l/jmock.svg" alt="License">
  </a>
</p>

> jmock — A simple and easy-to-use CLI HTTP server with Mock, Proxy, and static file serving.

Open source at: [https://github.com/Yakima-Teng/jmock](https://github.com/Yakima-Teng/jmock)

## Features

- ⚡ **Ready out of the box**: Start an HTTP server with a single command, with static file serving
- 🎯 **Data mocking**: Powerful mock data generation based on Mock.js
- 🔀 **Request proxy**: Built-in proxy to easily solve CORS issues
- 📄 **Auto directory listing**: Browse static files with directory index display
- 🔒 **HTTPS support**: Configurable HTTPS certificates for secure access

## Tech Stack

- ⚙️ **Runtime**: Node.js >= 22.18
- 📘 **Language**: TypeScript / ES Module
- 🧰 **Tools**: ESLint, Prettier, markdownlint-cli2
- 🔧 **Dependencies**: http-proxy, mockjs, union, chalk

## Requirements

- 📦 Node.js >= 22.18

## Installation

### Global Install (Recommended)

```bash
npm install --global jmock
```

After global installation, the `jmock` command is available from any directory.

### Run on Demand

Use `npx` to run without installing in advance:

```bash
npx jmock [path] [options]
```

### Install as a Project Dependency

```bash
npm install jmock
```

## Usage

```bash
jmock [path] [options]
```

`[path]` defaults to `./public` (if it exists), otherwise `./`.

After starting, visit [http://localhost:8080](http://localhost:8080) to view the server.

### Options

| Option      | Description                                          |
| ----------- | ---------------------------------------------------- |
| `-p <port>` | Specify port number, e.g. `jmock -p 8082`            |
| `--cors`    | Enable CORS via `Access-Control-Allow-Origin` header |
| `-o <path>` | Auto-open a specific path after startup              |
| `--config`  | Generate default config file `jmock.config.mjs`      |

### Data Mocking

Create a `jmock.config.mjs` file with the `mockTable` field:

```javascript
export default {
  mockTable: {
    // Supports req, query, body, method, Mock parameters
    "/api/hello": ({ req, query, body, method, Mock }) => {
      return {
        code: 200,
        data: {
          method,
          query,
          body,
          data: Mock.mock({
            "list|1-10": [{ "id|+1": 1 }],
          }),
        },
        message: "success",
      };
    },
    // Supports async/await
    "/api/world": async ({ query, body, method, Mock }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (method === "GET") {
        return {
          code: 200,
          data: {
            method,
            query,
            body,
            data: Mock.Random.paragraph(3, 7),
          },
          message: "success",
        };
      }
      return {
        code: 200,
        data: { method, query, body, data: Date.now() },
        message: "it's not a GET request.",
      };
    },
  },
};
```

Start the server and request `/api/world?c=1&d=hello`:

```javascript
fetch("/api/world?c=1&d=hello", {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  method: "POST",
  body: JSON.stringify({ a: 11, b: 22 }),
})
  .then((res) => res.json())
  .then((res) => console.log(res.data));
```

Example response:

```json
{
  "code": 200,
  "data": {
    "method": "POST",
    "query": { "c": "1", "d": "hello" },
    "body": { "a": 11, "b": 22 },
    "data": 1706670742590
  },
  "message": "it's not a GET request."
}
```

### Request Proxy

Add the `proxyTable` field to `jmock.config.mjs`:

```javascript
export default {
  proxyTable: {
    // Proxy /baidu-search?wd=keyword to https://www.baidu.com/s?wd=keyword
    "/baidu-search": {
      target: "https://www.baidu.com",
      changeOrigin: true,
      pathRewrite(path) {
        return path.replace("/baidu-search", "/s");
      },
    },
    // Proxy /search?q=keyword to https://cn.bing.com/search?q=keyword
    "/search": {
      target: "https://cn.bing.com",
      changeOrigin: true,
      cookieDomainRewrite: "",
    },
  },
};
```

### Generate Config File

```bash
jmock --config
```

Generates a `jmock.config.mjs` file in the current working directory with detailed example code.

## Acknowledgments

jmock is built on top of these projects:

- [http-server](https://github.com/http-party/http-server)
- [Mock.js](https://github.com/nuysoft/Mock)

## License

📄 [Apache License 2.0](https://github.com/Yakima-Teng/jmock/blob/master/LICENSE)
