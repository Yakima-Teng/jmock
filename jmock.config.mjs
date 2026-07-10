export default {
  // proxy your requests
  proxyTable: {
    // the below configuration will proxy /baidu-search?wd=keyword to https://www.baidu.com/s?wd=keyword
    "/baidu-search": {
      target: "https://www.baidu.com",
      changeOrigin: true,
      pathRewrite(path) {
        return path.replace("/baidu-search", "/s");
      },
    },
    // the below configuration will proxy /search?q=keyword to https://cn.bing.com/search?q=keyword
    "/search": {
      target: "https://cn.bing.com",
      changeOrigin: true,
      cookieDomainRewrite: "",
    },
  },
  // you can write your own logic code and return json as response, mock.js is out of the box as the Mock argument
  mockTable: {
    "/api/hello": ({ req, query, body, method, Mock }) => {
      return {
        code: 200,
        data: {
          method,
          query,
          body,
          data: Mock.mock({
            keysOfReq: Object.keys(req),
            // list is an array contains 1~10 elements
            "list|1-10": [
              {
                // id is a number whose initial value is 1, and is increased by 1 each time
                "id|+1": 1,
              },
            ],
          }),
        },
        message: "success",
      };
    },
    "/api/world": async ({ query, body, method, Mock }) => {
      // delay reply after 300ms
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
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
        data: {
          method,
          query,
          body,
          data: Date.now(),
        },
        message: "it's not a GET request.",
      };
    },
  },
};
