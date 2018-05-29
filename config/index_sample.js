const domain = {
  server1: 'http://www.example.com/',
  server2: 'http:localhost:6060'
}

const config = {
  showReadMe: true,
  port: '3000',
  // 将public目录映射成为url中root对应的目录
  root: '/test',
  // 代理请求，将请求转发至其他服务器，然后返回相应的内容
  proxyTable: {
    '/blog': {
      target: domain.server2,
      changeOrigin: true
    },
    '/wechat/KqPay': {
      target: domain.server1,
      changeOrigin: true
    }
  },
  // 读取固定的JSON文件内容作为返回值
  jsonTable: [
    '/manage2/intention/list',
    '/manage2/carInsurance/queryDetails'
  ],
  // 读取用户自定义的内容，可以在此处使用第三方数据模拟工具（默认已经预装了mockjs模块，开箱即用）
  customTable: [
    '/great/what'
  ]
}

module.exports = config
