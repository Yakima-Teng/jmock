[![npm](https://img.shields.io/npm/v/jmock.svg?style=flat-square)](https://www.npmjs.com/package/jmock)
[![npm downloads](https://img.shields.io/npm/dm/jmock?color=blue&label=npm%20downloads&style=flat-square)](https://www.npmjs.com/package/jmock)
[![license](https://img.shields.io/github/license/Yakima-Teng/jmock.svg?style=flat-square)](https://github.com/Yakima-Teng/jmock)

[中文文档](./README_zh-CN.md)

# jmock

jmock is a simple command-line http server for mocking data, proxying requests and serving static files.

![cute jmock](./screenshots/public.jpg)

## Installation

#### Running on-demand:

Using `npx` you can run the script without installing it first:

```bash
npx jmock [path] [options]
```

#### Globally via `npm` (RECOMMENDED)

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

**Generate a default configuration file with example code:**

```bash
jmock --config
```

The above code will generate a file named `jmock.config.js` with example configuration code (easy to understand). It's used for mocking data and proxying requests. For details, please refer to the introduction below.

**Mock data as HTTP response:**

Create a file named `jmock.config.js` (if not existed) at the path where you run the `jmock` command. Then add a field `mockTable` as below and then rerun the `jmock` command:

Tip: you can make use of the function arguments: `req`, `query`, `body`, `method`, and `Mock` ([Mock.js](https://www.npmjs.com/package/mockjs) is a convenient tools used for generating mocking data).

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

With the `mockTable` configuration above, http request to path `/api/world` as below:

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

will get response data like:

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

## License

Licensed under the MIT license.
