// https://github.com/standard-things/esm/issues/206 (Remove when @std/esm is >0.18.0)
require('nodegit')

require = require('@std/esm')(module)
require('./src/main.js')
