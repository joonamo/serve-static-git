import git from 'nodegit'

const { Repository, Clone, Reset } = git

// import rimraf from 'rimraf'
// rimraf.sync(REPOSITORY_PATH)

const callbacks = {
  certificateCheck: () => 1
}

export const clone = (url, path) =>
  Clone(url, path, {
    fetchOpts: { callbacks }
  })

export const open = (path) =>
  Repository.open(path)

export const fetchOrigin = (repo) =>
  repo.fetch('origin', { callbacks })

export const hardReset = (repo, target) =>
  Reset.reset(repo, target, Reset.TYPE.HARD)
