// https://webpack.js.org/api/loaders/#root
// https://www.npmjs.com/package/loader-utils
// https://www.npmjs.com/package/schema-utils
const loaderUtils = require('loader-utils')
const validateOptions = require('schema-utils')
const schema = {
  type: 'object',
  properties: {
    transform: {
      instanceof: 'Function',
    },
  },
}

function csv2json(source, map, meta) {
  this.cacheable && this.cacheable()
  const callback = this.async()
  const options = loaderUtils.getOptions(this)
  const { transform } = options

  validateOptions(schema, options, {
    name: 'csv2json',
  })

  setTimeout(() => {
    const s = source.replace(/module.exports\s*=\s*/, '')
    const books = JSON.parse(s)
    const data = books.reduce((prev, book) => {
      prev[book[0].trim().toUpperCase()] = transform ? transform(book[1]) : book[1]
      return prev
    }, {})
    callback(null, `module.exports = ${JSON.stringify(data)}`)
  }, 0)
  return
}

module.exports = csv2json
module.exports.default = csv2json

// module.exports.raw = true
