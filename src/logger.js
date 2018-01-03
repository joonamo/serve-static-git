import winston from 'winston'
import R from 'ramda'
import util from 'util'

const { createLogger, format, transports } = winston
const { colorize, combine, timestamp, printf } = format

const _format = (ts) => printf((info) => {
  const rest = R.omit(['timestamp', 'level', 'message'], info)
  return [
    ts ? info.timestamp : null,
    info.level + ':',
    typeof info.message === 'object'
      ? util.inspect(info.message)
      : info.message,
    !R.isEmpty(rest) ? util.inspect(
      rest,
      null,
      2
    ) : ''
  ].filter(x => x !== null).join(' ')
});

export default createLogger({
  level: 'debug',
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        _format(false)
      )
    }),
    new transports.File({
      filename: 'output.log',
      format: combine(
        timestamp(),
        _format(true)
      )
    })
  ]
})
