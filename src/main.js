import express from 'express'
import serveIndex from 'serve-index'
import bodyParser from 'body-parser'
import * as git from './git'
import stringify from 'json-stringify-pretty-compact'
import log from './logger'
import R from 'ramda'

const getEnvProp = (prop) =>
  process.env[prop] != null ? process.env[prop] : (() => {
    throw new Error(`${prop} not set in env`)
  })()

const [
  port,
  repoUrl,
  repoPath
] = R.map(getEnvProp, [
  'PORT',
  'REPOSITORY_URL',
  'REPOSITORY_PATH'
])

const app = express()
app.use(bodyParser.json())
app.listen(port, () =>
  log.info(`app listening on port ${port}!`))

const cloneOrOpenRepository = (url, path) =>
  git.open(path)
    .catch((err) => {
      log.error(err.stack)
      log.info(`cloning ${url} to ${path}`)
      return git.clone(url, path)
    })

const updateRepoWithHardReset = async (repo) => {
  log.debug(`fetching origin`)
  await git.fetchOrigin(repo)
  const commit = await repo.getBranchCommit('origin/master')
  log.debug(`latest commit on origin/master ${commit}`)
  await git.hardReset(repo, commit)
  log.debug(`reset repo to ${commit}`)
}

;(async () => {
  const repo = await cloneOrOpenRepository(repoUrl, repoPath)
  await updateRepoWithHardReset(repo)

  app.post('/update', (req, res) => {
    log.info(`update webhook endpoint triggered ${stringify(req.body)}`)
    updateRepoWithHardReset(repo)
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
