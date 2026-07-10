[![npm](https://img.shields.io/npm/v/jmock.svg?style=flat-square)](https://www.npmjs.com/package/jmock)
[![npm downloads](https://img.shields.io/npm/dm/jmock?color=blue&label=npm%20downloads&style=flat-square)](https://www.npmjs.com/package/jmock)
[![license](https://img.shields.io/github/license/Yakima-Teng/jmock.svg?style=flat-square)](https://github.com/Yakima-Teng/jmock)

# jmock

一个简单易用的命令行 HTTP 服务器，支持数据模拟（Mock）、请求代理（Proxy）和静态文件服务。

![cute jmock](./screenshots/public.jpg)

## 特性

- ⚡ **开箱即用**：一条命令启动 HTTP 服务器，支持静态文件服务
- 🎯 **数据模拟**：基于 Mock.js 的强大数据模拟能力，快速生成假数据接口
- 🔀 **请求代理**：内置代理功能，轻松解决跨域问题
- 📄 **自动目录浏览**：支持目录列表展示，方便浏览静态资源
- 🔒 **HTTPS 支持**：可配置 HTTPS 证书，支持安全访问

## 技术栈

- ⚙️ **运行时**：Node.js >= 22.18
- 📘 **语言**：TypeScript / ES Module
- 🧰 **工具**：ESLint、Prettier、markdownlint-cli2
- 🔧 **依赖**：http-proxy、mockjs、union、chalk

## 环境要求

- 📦 Node.js >= 22.18（详见 [.nvmrc](./.nvmrc)）

## 安装

### 全局安装（推荐）

```bash
npm install --global jmock
```

全局安装后可在任意目录使用 `jmock` 命令。

### 按需运行

使用 `npx` 无需安装即可运行：

```bash
npx jmock [path] [options]
```

### 作为项目依赖安装

```bash
npm install jmock
```

## 使用

```bash
jmock [path] [options]
```

`[path]` 默认为 `./public`（如果存在），否则为 `./`。

启动后访问 [http://localhost:8080](http://localhost:8080) 即可查看服务器。

### 选项

| 选项        | 说明                                             |
| ----------- | ------------------------------------------------ |
| `-p <port>` | 指定端口号，如 `jmock -p 8082`                   |
| `--cors`    | 启用 CORS，通过 `Access-Control-Allow-Origin` 头 |
| `-o <path>` | 启动后自动打开指定路径                           |
| `--config`  | 生成默认配置文件 `jmock.config.mjs`              |

### 数据模拟（Mock）

创建 `jmock.config.mjs` 配置文件，添加 `mockTable` 字段：

```javascript
export default {
  mockTable: {
    // 支持 req、query、body、method、Mock 参数
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
    // 支持 async/await
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

启动服务器后，请求 `/api/world?c=1&d=hello`：

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

响应示例：

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

### 请求代理（Proxy）

在 `jmock.config.mjs` 中添加 `proxyTable` 字段：

```javascript
export default {
  proxyTable: {
    // 将 /baidu-search?wd=keyword 代理到 https://www.baidu.com/s?wd=keyword
    "/baidu-search": {
      target: "https://www.baidu.com",
      changeOrigin: true,
      pathRewrite(path) {
        return path.replace("/baidu-search", "/s");
      },
    },
    // 将 /search?q=keyword 代理到 https://cn.bing.com/search?q=keyword
    "/search": {
      target: "https://cn.bing.com",
      changeOrigin: true,
      cookieDomainRewrite: "",
    },
  },
};
```

### 生成配置文件

```bash
jmock --config
```

将在当前目录生成 `jmock.config.mjs` 文件，内含详细的示例代码。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 8081，加载配置文件）
npm start

# 运行测试
npm test

# 监听模式运行测试
npm run test-watch

# 代码格式化
npm run format

# 代码检查
npm run lint:code

# 类型检查
npm run typecheck

# 全部检查（格式化 + lint + 类型检查 + 测试）
npm run lint
```

## 截图

|               启动界面               |                 目录浏览                 |
| :----------------------------------: | :--------------------------------------: |
| ![启动界面](./screenshots/start.png) | ![目录浏览](./screenshots/directory.png) |

## 致谢

jmock 基于以下项目构建：

- [http-server](https://github.com/http-party/http-server)
- [Mock.js](https://github.com/nuysoft/Mock)

## 协议

📄 [Apache License 2.0](./LICENSE)
