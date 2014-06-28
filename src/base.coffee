_    = require "underscore"
util = require "util"
cli  = require("cli").enable("status", "help", "version", "glob", "timeout")

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
    @cli = cli
    @set config

  set: (config) ->
    _.extend(this, config)
    @_normalize()
    valid = @_validate()
    if valid != true
      throw ErrorFmt.new "%s validation error. %s", @constructor.name, valid
    @_setup()

  _normalize: () ->
    return

  _validate: () ->
    return true

  _setup: () ->
    return

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
