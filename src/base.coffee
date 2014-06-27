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


  info: (str) ->
    @cli.info(str)
  debug: (str) ->
    @cli.debug(str)
  error: (str) ->
    @cli.error(str)
  fatal: (str) ->
    @cli.fatal(str)
  ok: (str) ->
    @cli.ok(str)

exports.Base = Base
