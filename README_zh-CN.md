[![npm](https://img.shields.io/npm/v/jmock.svg?style=flat-square)](https://www.npmjs.com/package/jmock)
[![npm downloads](https://img.shields.io/npm/dm/jmock?color=blue&label=npm%20downloads&style=flat-square)](https://www.npmjs.com/package/jmock)
[![license](https://img.shields.io/github/license/Yakima-Teng/jmock.svg?style=flat-square)](https://github.com/Yakima-Teng/jmock)

[英文文档](./README.md)

# jmock

jmock是一个创建HTTP服务的命令行工具，可用于模拟接口数据，转发请求，访问静态文件。

![cute jmock](./screenshots/public.jpg)

## 安装

#### 使用时即时安装

通过 `npx` 命令，可以在使用时即时安装，不需要提前安装:

```bash
npx jmock [path] [options]
```

#### 通过 `npm` 命令全局安装（推荐）

```bash
npm install --global jmock
```

全局安装后，你可以在电脑的任意位置直接通过命令行执行 `jmock` 命令。这样使用起来会非常方便。


#### 作为 `npm` 项目的本地依赖

```bash
npm install jmock
```

## 使用

```bash
jmock [path] [options]
```

`[path]` 默认为 `./public` （如果存在 `./public` 目录）, 或者 `./` （如果不存在 `./public` 目录）。

执行完上述命令后，你可以打开浏览器访问 http://localhost:8080 了。

**指定端口：**

```bash
jmock -p 8082
```

**开启跨域支持（通过设置 `Access-Control-Allow-Origin` 响应头）：**

```bash
jmock --cors
```

**启动服务后用浏览器自动访问指定路径：**

```bash
jmock -o /path
```

**生成默认配置文件：**

```bash
jmock --config
```

执行上述命令会生成一个 `jmock.config.js` 配置文件（带有浅显易懂的示例配置代码）。里面的配置是用于模拟接口响应数据和转发请求的。具体可以看下文介绍。

**模拟接口响应数据：**

在要执行 `jmock` 命令的位置，创建一个 `jmock.config.js` 文件（如果不存在的话）。然后按下面的示例配置 `mockTable` 字段后重启 `jmock` 服务。

提示：我们提供了`req` 、 `query` 、 `body` 、 `method` 和 `Mock`（[Mock.js](https://www.npmjs.com/package/mockjs)是一个用于生成模拟数据的工具包）作为函数入参。你可以擅用它们来写一写简单的业务逻辑。

```javascript
module.exports = {
    // you can write your own logic code and return json as response, mock.js is out of the box as the Mock argument
    mockTable: {
        // eslint-disable-next-line no-console
        '/api/hello': ({ req, query, body, method, Mock }) => {
            return {
                code: 200,
                data: {
                    method,
                    query,
                    body,
                    data: Mock.mock({
                        // list is an array contains 1~10 elements
                        'list|1-10': [{
                            // id is a number whose initial value is 1, and is increased by 1 each time
                            'id|+1': 1
                        }]
                    }),
                },
                message: 'success',
            }
        },
        // you can also use async/await here
        '/api/world': async ({ req, query, body, method, Mock }) => {
            // delay reply after 300ms
            await new Promise((resolve) => {
                setTimeout(resolve, 300)
            })
            if (method === 'GET') {
                return {
                    code: 200,
                    data: {
                        method,
                        query,
                        body,
                        data: Mock.Random.paragraph(3, 7),
                    },
                    message: 'success',
                }
            }
            return {
                code: 200,
                data: {
                    method,
                    query,
                    body,
                    data: Date.now(),
                },
                message: 'it\'s not a GET request.',
            }
        }
    },
}
```

以上面的 `mockTable` 配置为例，假设现在有如下的请求发送到 `/api/world` 路径：

```javascript
fetch("/api/world?c=1&d=hello",
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({a: 11, b: 22})
        })
        .then((res) => {
            return res.json()
        })
        .then((res) => {
            console.log(res.data)
        })
        .catch((res) => {
            console.log(res)
        })
```

我们会得到如下这般的响应数据：

```json
{
  "code": 200,
  "data": {
    "method": "POST",
    "query": {
      "c": "1",
      "d": "hello"
    },
    "body": {
      "a": 11,
      "b": 22
    },
    "data": 1706670742590
  },
  "message": "it's not a GET request."
}
```

**转发 HTTP请求：**

在要执行 `jmock` 命令的位置，创建一个 `jmock.config.js` 文件（如果不存在的话）。然后按下面的示例配置 `proxyTable` 字段后重启 `jmock` 服务。

```javascript
module.exports = {
    // proxy your requests
    proxyTable: {
        // the below configuration will proxy /baidu-search?wd=keyword to https://www.baidu.com/s?wd=keyword
        '/baidu-search': {
            target: 'https://www.baidu.com',
            changeOrigin: true,
            pathRewrite (path) {
                return path.replace('/baidu-search', '/s')
            },
        },
        // the below configuration will proxy /search?q=keyword to https://cn.bing.com/search?q=keyword
        '/search': {
            target: 'https://cn.bing.com',
            changeOrigin: true,
            cookieDomainRewrite: '',
        },
    },
}
```

## 致谢

jmock 基于 [`http-server`](https://github.com/http-party/http-server)构建而成。
