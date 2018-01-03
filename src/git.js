import git from 'nodegit'

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
