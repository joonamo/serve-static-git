import app from './app'
import express from 'express'
import serveIndex from 'serve-index'
import * as git from './git'
import log from './logger'

const {
  REPOSITORY_URL,
  REPOSITORY_PATH,
  PORT
} = process.env

app.listen(PORT, () =>
  log.info(`app listening on port ${PORT}!`))

const cloneOrOpenRepository = (url, path) =>
  git.open(path)
    .catch((err) => {
      log.error(err.stack)
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
  const repo = await cloneOrOpenRepository(REPOSITORY_URL, REPOSITORY_PATH)
  await updateRepoWithHardReset(repo)

  app.use('/',
    express.static(REPOSITORY_PATH),
    serveIndex(REPOSITORY_PATH, {
      icons: true
    })
  )

  log.info(`serving ${REPOSITORY_PATH} at /`)
})()
.catch((err) => {
  log.error(err.stack)
})

process.on('unhandledRejection', (err) => {
  throw err
})
