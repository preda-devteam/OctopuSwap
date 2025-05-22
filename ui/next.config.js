const webpack = require('webpack')
// const withCsv2json = require('./config/next-csv2json.js')
const { NODE_ENV, NEXT_PUBLIC_SITE_ENV } = process.env
// const withImg = require('./config/next-img')
const isProd = !!NODE_ENV && NODE_ENV.toLocaleLowerCase() === 'production' && NEXT_PUBLIC_SITE_ENV !== 'test'
const isDev = NODE_ENV === 'development'
const { version } = require('./package.json')
const { withSentryConfig } = require('@sentry/nextjs')
// const fs = require('fs')
// const hasSentryrc = fs.existsSync('./.sentryclirc')

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore
  org: 'idea',
  project: 'xrei',
  authToken: process.env.SENTRY_TOKEN,
  sentryUrl: 'https://sentry.moqun.cn/',
  silent: !process.env.SENTRY_TOKEN, // Suppresses all logs
  release: {
    name: version,
    dist: version,
    create: false,
    finalize: false,
  },
  sourcemaps: {
    disable: false,
    assets: ['.next', './src'],
    ignore: ['node_modules', 'next.config.js'],
    deleteSourcemapsAfterUpload: true,
  },
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
}
const nextConfig = {
  assetPrefix: '',
  reactStrictMode: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
