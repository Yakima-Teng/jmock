[![npm](https://img.shields.io/npm/v/jmock.svg?style=flat-square)](https://www.npmjs.com/package/jmock)
[![npm downloads](https://img.shields.io/npm/dm/jmock?color=blue&label=npm%20downloads&style=flat-square)](https://www.npmjs.com/package/jmock)
[![license](https://img.shields.io/github/license/Yakima-Teng/jmock.svg?style=flat-square)](https://github.com/Yakima-Teng/jmock)

# jmock: command-line HTTP mock server

jmock is a simple command-line static HTTP server with mock and proxy abilities out of the box. It is aimed at local development, serving static files, mocking data, and proxying HTTP requests.

![cute jmock](./screenshots/public.jpg)

## Installation

#### Running on-demand:

Using `npx` you can run the script without installing it first:

```bash
npx jmock [path] [options]
```

#### Globally via `npm`

```bash
npm install --global jmock
```

This will install `jmock` globally so that it may be run from the command line anywhere.


#### As a dependency in your `npm` package:

```bash
npm install jmock
```

## Usage

```bash
jmock [path] [options]
```

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

Now you can visit http://localhost:8080 to view your server

**Use a specified port:**

```bash
jmock -p 8082
```

**Enable CORS via the Access-Control-Allow-Origin header:**

```bash
jmock --cors
```

**Open path after starting the server:**

```bash
jmock -o /path
```

**Mock data as HTTP response:**

Create a file named `jmock.config.js` (if not existed) at the path where you run the `jmock` command. Then add a field `mockTable` as below and then rerun the `jmock` command:

Tip: you can make of the arguments: `req`, `query`, `body`, `method`, and `Mock`. `Mock` is [Mock.js](https://www.npmjs.com/package/mockjs).

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
    },
}
```

**Proxy HTTP requests:**

Create a file named `jmock.config.js` (if not existed) at the path where you run the `jmock` command. Then add a field `proxyTable` as below and then rerun the `jmock` command:

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

## Thanks

jmock is built on top of [`http-server`](https://github.com/http-party/http-server).
