const Koa = require('koa')
const next = require('next')
const bodyParser = require('koa-bodyparser')
const Router = require('@koa/router')
const { logger } = require('./logger')
const port = parseInt(process.env.PORT, 10) || 11000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = new Koa()
  const router = new Router()

  router.all('(.*)', async ctx => {
    ctx.respond = false
    ctx.request.headers['x-current-path'] = ctx.request.url
    ctx.response.status = 200
    await handle(ctx.req, ctx.res)
  })

  server.on('error', (err, ctx) => {
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
      logger.warn('Server on error: ' + err.code)
      return
    }
    logger.fatal(err)
  })

  server.use(bodyParser())
  server.use(router.routes())
  server.listen(port, () => {
    logger.info(`> Ready on http://localhost:${port}`)
  })
})

process.on('uncaughtException', function (err) {
  logger.fatal('uncaughtException: ' + err, err.stack)
})

process.on('unhandledRejection', function (err) {
  logger.fatal('unhandledRejection: ' + err, err.stack)
})
