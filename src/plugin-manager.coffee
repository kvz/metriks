exec    = require("child_process").exec
Plugin  = require("./plugin").Plugin
_       = require "underscore"
async   = require "async"
fs      = require "fs"
glob    = require "glob"
os      = require "os"
sys     = require "sys"
util    = require "util"
path    = require "path"
mkdirp  = require "mkdirp"
Base    = require("./base").Base

class PluginManager extends Base
  constructor: (config) ->
    super config


    # mgr config
    @pluginDir   = null
    @concurrency = 2

    # plugin config
    @autoWritePng = false
    @autoUploadS3 = false

    # graph config
    @rrdDir = null
    @pngDir = null

    # internals
    @_q = {}
    @_timers = []
    @_plugins = {}
    _.extend this, config
    throw new Error("Please set the pluginDir")  unless @pluginDir

  find: (pattern, cb) ->
    @_loadAll false, (err) =>
      throw err  if err
      for key of @_plugins
        plugin = @_plugins[key]
        return cb(null, plugin)  if plugin.name is pattern
        return cb(null, plugin)  if plugin.rrd.rrdFile is pattern
      cb null, null

  graph: (pattern) ->
    @_loadAll false, (err) =>
      throw err  if err
      plugin = @find(pattern)
      @_writePNG plugin, (err) =>
        throw err  if err
        @info("open %s", plugin.pngFile)

  _loop: (plugin, cb) =>
    @info("Running plugin %s at interval %s to %s", plugin.name, plugin.interval, plugin.rrdFile)
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
          @debug("Skipping plugin %s as it is not executable", plugin.name)
          return
        unless plugin.enabled
          @debug("Skipping plugin %s as it is not enabled", plugin.name)
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
    return

  _loadAll: (reset, cb) ->
    # Load plugin configuration from disk
    return cb(null)  if _.keys(@_plugins).length and reset isnt true
    return cb(new Error(util.format("Plugin directory %s does not exist", @pluginDir)))  unless fs.existsSync(@pluginDir)
    glob @pluginDir + "/*", {}, (err, files) =>
      return cb(err)  if err
      files.forEach (pluginFile) =>
        plugin = new Plugin(
          pluginFile  : pluginFile
          rrdDir      : @rrdDir
          pngDir      : @pngDir
          autoWritePng: @autoWritePng
          autoUploadS3: @autoUploadS3
          cli         : @cli
        )
        plugin.reload (err) =>
          return cb(err)  if err
          @_plugins[plugin.name] = plugin
          cb null  if _.keys(@_plugins).length is files.length

exports.PluginManager = PluginManager
