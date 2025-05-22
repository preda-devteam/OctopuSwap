const log4js = require('log4js')
const isProduction = process.env.NODE_ENV === 'production'

const { configure, getLogger, shutdown } = log4js

// Level rule: ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
// See https://log4js-node.github.io/log4js-node/appenders.html
configure({
  appenders: {
    out: {
      type: 'stdout',
    },
    emergencies: {
      type: 'file',
      filename: 'logs/panic.log',
    },
    // See https://log4js-node.github.io/log4js-node/logLevelFilter.html
    errors: {
      type: 'logLevelFilter',
      appender: 'emergencies',
      level: 'error',
    },
    // See https://log4js-node.github.io/log4js-node/dateFile.html
    app: {
      type: 'dateFile',
      filename: 'logs/combined.log',
      pattern: '.yyyy-MM-dd',
      keepFileExt: true,
      daysToKeep: 7,
    },
    // See https://github.com/log4js-node/redis
    // redis: { type: '@log4js-node/redis', channel: 'logs', host: '', port: '', pass: '' }
  },
  categories: {
    kaasApp: { appenders: ['out', 'errors', 'app'], level: 'debug' },
    default: { appenders: ['out', 'errors', 'app'], level: 'debug' },
  },
  // https://log4js-node.github.io/log4js-node/clustering.html
  // Set this to true if you’re running your app using pm2, otherwise logs will not work (you’ll also need to install pm2-intercom as pm2 module: pm2 install pm2-intercom)
  pm2: false,
  // Every process do logging not only master process
  disableClustering: true,
  pm2InstanceVar: 'INSTANCE_ID',
})

exports.logger = getLogger('XREI')
exports.shutdown = shutdown
