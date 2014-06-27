_    = require "underscore"
util = require "util"

class ErrorFmt
  @new: (args...) ->
    str     = util.format.apply this, args
    e       = new Error(str)
    e.stack = e.stack.replace /.*ErrorFmt.*/, ""
    return e

exports.ErrorFmt = ErrorFmt

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
    @set config

  set: (config) ->
    config = @_defaults config
    config = @_normalize config
    result = @_validate config
    if result != true
      throw ErrorFmt.new "%s validation error. %s", @constructor.name, result

    _.extend this, config

  _defaults: (config) ->
    return config

  _normalize: (config) ->
    return config

  _validate: (config) ->
    return true

  fmt: (args...) ->
    return util.format.apply this, args

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
