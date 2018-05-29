const domain = {
  douban: 'https://api.douban.com'
}

const config = {
  showReadMe: true,
  port: '3000',
  // 将public目录映射成为url中root对应的目录
  root: '/test',
  // 代理请求，将请求转发至其他服务器，然后返回相应的内容
  proxyTable: {
    '/apis/proxy': {
      target: domain.douban,
      changeOrigin: true
    }
  },
  // 读取固定的JSON文件内容作为返回值
  jsonTable: [
    '/apis/json'
  ],
  // 读取用户自定义的内容，可以在此处使用第三方数据模拟工具（默认已经预装了mockjs模块，开箱即用）
  customTable: [
    '/apis/custom'
  ]
}

module.exports = config
