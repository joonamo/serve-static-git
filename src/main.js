import express from 'express'
import serveIndex from 'serve-index'
import bodyParser from 'body-parser'
import session from 'express-session'
import gauth from '@reaktor/express-gauth'
import stringify from 'json-stringify-pretty-compact'
import * as git from './git'
import log from './logger'
import config from './config'
import unless from './unless'

const setupRepo = async (path, url, creds) => {
  const repo = await git.openOrClone(url, path, creds)
  await git.fetchAndHardReset(repo, creds)
  return repo
}

const setup = async (app, config) => {
  const path = config.REPO_PATH
  const url = config.REPO_URL
  const creds = {
    pubKey: config.SSH_PUBLIC_KEY,
    privKey: config.SSH_PRIVATE_KEY
  }

  const repo = await setupRepo(path, url, creds)

  // TODO: Verify POST_WEBHOOK_SECRET
  app.post('/update', async (req, res) => {
    log.info(`update webhook endpoint triggered ${stringify(req.body)}`)
    await git.fetchAndHardReset(repo, creds)
    res.status(200).end()
  })

  app.use('/',
    express.static(path),
    serveIndex(path, {
      icons: true
    }))

  log.info(`serving ${path} at /`)

  app.listen(config.PORT, () =>
    log.info(`app listening on port ${config.PORT}!`))
}

const app = express()

app.use(bodyParser.json())
app.use(unless('POST', '/update', session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
})))

app.use(unless('POST', '/update', gauth({
  clientID: config.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET,
  clientDomain: config.BASE_URL,
  allowedDomains: config.GOOGLE_OAUTH_ALLOWED_DOMAINS.split(',')
})))

setup(app, config)
  .catch((err) => {
    log.error(err.stack)
    process.exit(1)
  })

process.on('unhandledRejection', (err) => {
  throw err
})
