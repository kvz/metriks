_       = require "underscore"
connect = require "connect"
util    = require "util"
Base    = require("./base").Base
Err     = require("./base").ErrorFmt

class WebServer extends Base
  @webPort: 8000
  @pngDir : ""

  start: ->
    server = connect()
    server.use connect.static @pngDir,
      hidden: false
    server.use connect.directory @pngDir, {}
    server.listen @webPort, ->
      @info "Serving %s on port %s", @pngDir, @webPort

exports.WebServer = WebServer
