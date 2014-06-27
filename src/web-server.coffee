_       = require "underscore"
connect = require "connect"
util    = require "util"
Base    = require("./base").Base

class WebServer extends Base
  constructor: (config) ->
    super config
    @webPort = 8000
    @pngDir  = ""

    _.extend this, config
    return

  start: ->
    server = connect()
    server.use connect.static(@pngDir,
      hidden: false
    )
    server.use connect.directory(@pngDir, {})
    server.listen @webPort, ->
      @info("Serving %s on port %s", @pngDir, @webPort)

exports.WebServer = WebServer
