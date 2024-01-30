module.exports = {
    // 代理请求，将请求转发至其他服务器，然后返回相应的内容
    proxyTable: {
        '/baidu-search': {
            target: 'https://www.baidu.com',
            changeOrigin: true,
            // eslint-disable-next-line no-unused-vars
            pathRewrite (path, req) {
                return path.replace('/baidu-search', '/s')
            },
        },
        '/search': {
            target: 'https://cn.bing.com',
            changeOrigin: true,
            cookieDomainRewrite: '',
        },
    },
    // 读取用户自定义的内容，可以在此处使用第三方数据模拟工具（默认已经预装了mockjs模块，开箱即用）
    customTable: [
        '/apis/custom',
    ],
}
