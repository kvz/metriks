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

class PluginManager
  constructor: (config) ->

    # mgr config
    @cli =
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

    @pluginDir = null
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
    return

  find: (pattern, cb) ->
    self = this
    self._loadAll false, (err) ->
      throw err  if err
      for key of self._plugins
        plugin = self._plugins[key]
        return cb(null, plugin)  if plugin.name is pattern
        return cb(null, plugin)  if plugin.rrd.rrdFile is pattern
      cb null, null

    return

  graph: (pattern) ->
    self = this
    self._loadAll false, (err) ->
      throw err  if err
      plugin = self.find(pattern)
      self._writePNG plugin, (err) ->
        throw err  if err
        self.cli.info util.format("open %s", plugin.pngFile)
        return

      return

    return

  _loop: (self, plugin, cb) ->
    self.cli.info util.format("Running plugin %s at interval %s to %s", plugin.name, plugin.interval, plugin.rrdFile)
    plugin.run cb

    # Reschedule
    self._timers.push setTimeout(->
      self._q.push plugin
      return
    , plugin.interval * 1000)
    return

  start: ->
    self = this
    self._loadAll false, (err) ->
      throw err  if err
      _.each self._plugins, (plugin) ->

        # Loop plugin
        unless plugin.executable
          self.cli.debug util.format("Skipping plugin %s as it is not executable", plugin.name)
          return
        unless plugin.enabled
          self.cli.debug util.format("Skipping plugin %s as it is not enabled", plugin.name)
          return
        self._q = async.queue((plugin, cb) ->

          # We need to pass on `self`
          self._loop self, plugin, cb
          return
        , self.concurrency)
        self._q.drain = ->
          self.cli.debug util.format("waiting for new items to be pushed to queue")
          return

        self._q.push plugin
        return

      return

    return


  ###
  Clear all timers
  ###
  stop: ->
    for i of self._timers
      clearTimeout self._timers[i]
    return


  ###
  Load plugin configuration from disk
  @param  {Function} cb
  @return {[type]}
  ###
  _loadAll: (reset, cb) ->
    self = this
    return cb(null)  if _.keys(self._plugins).length and reset isnt true
    return cb(new Error(util.format("Plugin directory %s does not exist", self.pluginDir)))  unless fs.existsSync(self.pluginDir)
    glob self.pluginDir + "/*", {}, (err, files) ->
      return cb(err)  if err
      files.forEach (pluginFile) ->
        plugin = new Plugin(
          pluginFile: pluginFile
          rrdDir: self.rrdDir
          pngDir: self.pngDir
          autoWritePng: self.autoWritePng
          autoUploadS3: self.autoUploadS3
          cli: self.cli
        )
        plugin.reload (err) ->
          return cb(err)  if err
          self._plugins[plugin.name] = plugin
          cb null  if _.keys(self._plugins).length is files.length
          return

        return

      return

    return


exports.PluginManager = PluginManager
