import express from 'express'
import serveIndex from 'serve-index'
import bodyParser from 'body-parser'
import session from 'express-session'
import R from 'ramda'
import gauth from '@reaktor/express-gauth'
import stringify from 'json-stringify-pretty-compact'
import * as git from './git'
import log from './logger'
import config from './config'

const [
  baseUrl,
  port,
  repoUrl,
  repoPath,
  pubKey,
  privKey,
  gauthClientId,
  gauthClientSecret,
  gauthAllowedDomains
] = R.values(config)

const app = express()
app.use(bodyParser.json())
app.listen(port, () =>
  log.info(`app listening on port ${port}!`))

app.use(session({
  secret: 'lol',
  resave: false,
  saveUninitialized: true
}))

app.use(gauth({
  clientID: gauthClientId,
  clientSecret: gauthClientSecret,
  clientDomain: baseUrl,
  allowedDomains: gauthAllowedDomains.split(',')
}))

;(async () => {
  const creds = { pubKey, privKey }
  const repo = await git.openOrClone(repoUrl, repoPath, creds)
  await git.fetchAndHardReset(repo, creds)

  app.post('/update', async (req, res) => {
    log.info(`update webhook endpoint triggered ${stringify(req.body)}`)
    await git.fetchAndHardReset(repo, creds)
    res.status(200).end()
  })

  app.use('/',
    express.static(repoPath),
    serveIndex(repoPath, {
      icons: true
    }))

  log.info(`serving ${repoPath} at /`)
})()
.catch((err) => {
  log.error(err.stack)
})

process.on('unhandledRejection', (err) => {
  throw err
})
