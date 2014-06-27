_       = require "underscore"
connect = require "connect"
util    = require "util"

class WebServer
  constructor: (config) ->
    @webPort = 8000
    @pngDir  = ""
    @cli     =
      info: (str) ->
        console.log "INFO:  " + str
        return

      debug: (str) ->
        console.log "DEBUG: " + str
        return

      error: (str) ->
        console.log "ERROR: " + str
        return

      fatal: (str) ->
        console.log "FATAL: " + str
        return

      ok: (str) ->
        console.log "OK:    " + str
        return

    _.extend this, config
    return

  start: ->
    self   = this
    server = connect()
    server.use connect.static(self.pngDir,
      hidden: false
    )
    server.use connect.directory(self.pngDir, {})
    server.listen self.webPort, ->
      self.cli.info util.format("Serving %s on port %s", self.pngDir, self.webPort)
      return

    return

exports.WebServer = WebServer
