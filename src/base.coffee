_       = require "underscore"
util    = require "util"

class Base
  constructor: (config) ->
    @cli =
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

exports.Base = Base
