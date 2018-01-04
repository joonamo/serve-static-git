import git from 'nodegit'
import log from './logger'

const { Repository, Clone, Reset, Cred } = git

const buildCallbacks = ({ pubKey, privKey }) => ({
  certificateCheck: () => 1,
  credentials: (repoUrl, username) =>
    Cred.sshKeyMemoryNew(username, pubKey, privKey, '')
})

export const clone = (url, path, creds) =>
  Clone(url, path, {
    fetchOpts: {
      callbacks: buildCallbacks(creds)
    }
  })

export const open = (path) =>
  Repository.open(path)

export const fetchOrigin = (repo, creds) =>
  repo.fetch('origin', {
    callbacks: buildCallbacks(creds)
  })

export const hardReset = (repo, target) =>
  Reset.reset(repo, target, Reset.TYPE.HARD)

export const fetchAndHardReset = async (repo, creds) => {
  log.debug(`fetching origin`)
  await fetchOrigin(repo, creds)
  const commit = await repo.getBranchCommit('origin/master')
  log.debug(`latest commit on origin/master ${commit}`)
  await hardReset(repo, commit)
  log.debug(`reset repo to ${commit}`)
}

export const openOrClone = (url, path, creds) =>
  open(path)
    .catch((err) => {
      log.warn(err.stack)
      log.info(`cloning ${url} to ${path}`)
      return git.clone(url, path, creds)
    })
