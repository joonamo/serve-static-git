import express from 'express'
import serveIndex from 'serve-index'
import bodyParser from 'body-parser'
import session from 'express-session'
import * as git from './git'
import stringify from 'json-stringify-pretty-compact'
import log from './logger'
import gauth from '@reaktor/express-gauth'
import R from 'ramda'

const getEnvProp = (prop) =>
  process.env[prop] != null ? process.env[prop] : (() => {
    throw new Error(`${prop} not set in env`)
  })()

const getConfig = (props) =>
  R.zipObj(props, R.map(getEnvProp, props))

const config = getConfig([
  'PORT',
  'REPO_URL',
  'REPO_PATH',
  'SSH_PUBLIC_KEY',
  'SSH_PRIVATE_KEY',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET'
])

const SECRETS = ['SSH_PRIVATE_KEY', 'GOOGLE_OAUTH_CLIENT_SECRET']
const maskKeys = (keys, obj) => R.mapObjIndexed((val, key) => SECRETS.includes(key) ? '[secret]' : val, obj)
log.info(`config ${stringify(maskKeys(['SSH_PRIVATE_KEY', 'GOOGLE_OAUTH_CLIENT_SECRET'], config))}`)

const [
  port,
  repoUrl,
  repoPath,
  pubKey,
  privKey,
  gauthClientId,
  gauthClientSecret
] = R.values(config)

const app = express()
app.use(bodyParser.json())
app.listen(port, () =>
  log.info(`app listening on port ${port}!`))

const cloneOrOpenRepository = (url, path, creds) =>
  git.open(path)
    .catch((err) => {
      log.warn(err.stack)
      log.info(`cloning ${url} to ${path}`)
      return git.clone(url, path, creds)
    })

const updateRepoWithHardReset = async (repo, creds) => {
  log.debug(`fetching origin`)
  await git.fetchOrigin(repo, creds)
  const commit = await repo.getBranchCommit('origin/master')
  log.debug(`latest commit on origin/master ${commit}`)
  await git.hardReset(repo, commit)
  log.debug(`reset repo to ${commit}`)
}

;(async () => {
  const creds = { pubKey, privKey }
  const repo = await cloneOrOpenRepository(repoUrl, repoPath, creds)
  await updateRepoWithHardReset(repo, creds)

  app.use(session({
    secret: 'lol',
    resave: false,
    saveUninitialized: true
  }))

  app.use(gauth({
    clientID: gauthClientId,
    clientSecret: gauthClientSecret,
    clientDomain: 'http://localhost:3000',
    allowedDomains: ['reaktor.fi', 'reaktor.com']
  }))

  app.post('/update', async (req, res) => {
    log.info(`update webhook endpoint triggered ${stringify(req.body)}`)
    await updateRepoWithHardReset(repo, creds)
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
