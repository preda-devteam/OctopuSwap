const path = require('path')
const csv2jsonLoader = require('./csv2json-loader')

module.exports = nextConfig => {
  const oldWebpack = nextConfig.webpack
  if (typeof oldWebpack === 'function') {
    nextConfig.webpack = (config, options) => {
      oldWebpack(config, options)
      const dir = path.resolve(__dirname, '..', 'src', 'i18n')
      config.module = config.module || {}
      config.module.rules = config.module.rules || []
      config.module.rules.push({
        test: /\.csv$/,
        include: [dir],
        use: [
          {
            loader: path.resolve('config/csv2json-loader.js'),
            options: {
              transform(book) {
                return book.replace(/%@/gi, '%s')
              },
            },
          },
          {
            loader: 'csv-loader',
            options: {
              dynamicTyping: true,
              header: false,
              skipEmptyLines: true,
            },
          },
        ],
      })
      return config
    }
  }
  return nextConfig
}
