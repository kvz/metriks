exec   = require("child_process").exec
Plugin = require("./plugin").Plugin
_      = require "underscore"
async  = require "async"
fs     = require "fs"
glob   = require "glob"
os     = require "os"
sys    = require "sys"
util   = require "util"
path   = require "path"
mkdirp = require "mkdirp"
Base   = require("./base").Base
Err    = require("./base").ErrorFmt

class PluginManager extends Base
  # mgr config
  pluginDir  : null
  concurrency: 2

  # plugin config
  autoWritePng: false
  autoUploadS3: false

  # graph config
  rrdDir: null
  pngDir: null

  # internals
  _q      : {}
  _timers : []
  _plugins: {}

  _validate: (config) ->
    if not config.pluginDir?
      return "Please set the pluginDir"
    return true

  find: (pattern, cb) ->
    console.log
      thi: this

    @_loadAll false, (err) =>
      if err
        throw err

      for key of @_plugins
        plugin = @_plugins[key]
        if plugin.name is pattern
          return cb null, plugin
        if plugin.rrd.rrdFile is pattern
          return cb null, plugin

      cb null, null

  graph: (pattern) ->
    @_loadAll false, (err) =>
      if err
        throw err

      plugin = @find(pattern)
      @_writePNG plugin, (err) =>
        if err
          throw err
        @info("open %s", plugin.pngFile)

  _loop: (plugin, cb) =>
    @info "Running plugin %s at interval %s to %s",
      plugin.name, plugin.interval, plugin.rrdFile
    plugin.run cb

    # Reschedule
    @_timers.push setTimeout(=>
      @_q.push plugin
    , plugin.interval * 1000)

  start: ->
    @_loadAll false, (err) =>
      if err
        throw err
      _.each @_plugins, (plugin) =>
        # Loop plugin
        unless plugin.executable
          @debug "Skipping plugin %s as it is not executable", plugin.name
          return
        unless plugin.enabled
          @debug "Skipping plugin %s as it is not enabled", plugin.name
          return
        @_q = async.queue((plugin, cb) =>
          # We need to pass on `self`
          @_loop plugin, cb
        , @concurrency)
        @_q.drain = =>
          @debug("waiting for new items to be pushed to queue")

        @_q.push plugin

  stop: ->
    # Clear all timers
    for i of @_timers
      clearTimeout @_timers[i]

  _loadAll: (reset, cb) ->
    # Load plugin configuration from disk
    if _.keys(@_plugins).length and reset isnt true
      return cb null
    unless fs.existsSync(@pluginDir)
      return cb Err.new("Plugin directory %s does not exist", @pluginDir)
    glob @pluginDir + "/*", {}, (err, files) =>
      if err
        return cb err

      for pluginFile in files
        plugin = new Plugin
          pluginFile  : pluginFile
          rrdDir      : @rrdDir
          pngDir      : @pngDir
          autoWritePng: @autoWritePng
          autoUploadS3: @autoUploadS3
          cli         : @cli

        plugin.reload (err) =>
          if err
            return cb err

          @_plugins[plugin.name] = plugin
          if _.keys(@_plugins).length is files.length
            cb null

exports.PluginManager = PluginManager
