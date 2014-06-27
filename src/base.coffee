_       = require "underscore"
util    = require "util"

class Base
  cli:
    info: (str) ->
      console.log "INFO:  " + str
    debug: (str) ->
      console.log "DEBUG: " + str
    error: (str) ->
      console.log "ERROR: " + str
    fatal: (str) ->
      console.log "FATAL: " + str
    ok: (str) ->
      console.log "OK:    " + str

  constructor: (config) ->
    # _exten

  fmt: (args...) ->
    str = util.format.apply this, args
    return str

  info: (args...) ->
    @cli.info @fmt.apply(this, args)
  debug: (args...) ->
    @cli.debug @fmt.apply(this, args)
  error: (args...) ->
    @cli.error @fmt.apply(this, args)
  fatal: (args...) ->
    @cli.fatal @fmt.apply(this, args)
  ok: (args...) ->
    @cli.ok @fmt.apply(this, args)

exports.Base = Base
