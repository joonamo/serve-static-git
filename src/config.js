import R from 'ramda'
import stringify from 'json-stringify-pretty-compact'
import log from './logger'

const SECRETS = [
  'SSH_PRIVATE_KEY',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'SESSION_SECRET'
]

const getEnvProp = (prop) =>
  process.env[prop] != null ? process.env[prop] : (() => {
    throw new Error(`${prop} not set in env`)
  })()

const getConfig = (props) =>
  R.zipObj(props, R.map(getEnvProp, props))

const maskKeys = (keys, obj) =>
  R.mapObjIndexed((val, key) => SECRETS.includes(key) ? '[secret]' : val, obj)

const config = getConfig([
  'BASE_URL',
  'PORT',
  'REPO_URL',
  'REPO_PATH',
  'SSH_PUBLIC_KEY',
  'SSH_PRIVATE_KEY',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_ALLOWED_DOMAINS',
  'SESSION_SECRET'
])

log.info(`config ${stringify(maskKeys(SECRETS, config))}`)

export default config
