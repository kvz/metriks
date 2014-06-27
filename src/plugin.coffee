exec               = require("child_process").exec
RRD                = require("./rrd").RRD
unflatten          = require("flat").unflatten
_                  = require "underscore"
async              = require "async"
fs                 = require "fs"
glob               = require "glob"
os                 = require "os"
sys                = require "sys"
util               = require "util"
path               = require "path"
knox               = require "knox"
Base               = require("./base").Base
Err                = require("./base").ErrorFmt
_.templateSettings = interpolate: /\{(.+?)\}/g

class Plugin extends Base
  constructor: (config) ->
    super config
    @defaultConfig =
      interval  : "60"
      enabled   : true
      executable: true

    # mgr config
    @pluginFile   = null
    @autoWritePng = null
    @autoUploadS3 = null

    _.extend this, config

  # Parse options from source's comments
  reload: (cb) ->
    @info("Loading plugin %s. This also executes it with 'config' parameter so you can print dynamic config. ", @pluginFile)
    opts =
      encoding  : "utf8"
      timeout   : 10 * 1000
      maxBuffer : 200 * 1024
      killSignal: "SIGTERM"
      cwd       : path.dirname(@pluginFile)
      env       : process.ENV

    exec @pluginFile + " config", opts, (err, stdout, stderr) =>
      if err
        return cb(Err.new("Cannot execute plugin %s. If you want to disable please set '# config.enable: false'. %s %s %s", 
          @pluginFile, stderr, err, stdout))

      # Parse comment header
      flat         = {}
      commentLines = stdout.match(/^#(.*)$/g)
      if commentLines and commentLines.length
        commentLines.forEach (line) ->
          cfgKey       = line.match(/^#\s*([^:]+)\s*/)[1]
          cfgVal       = line.match(/:\s*(.*)\s*$/)[1]
          flat[cfgKey] = cfgVal

      # Convert flat -> structure to recursive
      nested = unflatten(flat,
        delimiter: "->"
        object   : true
      )

      # Apply defaults to said config
      _.extend this, @defaultConfig, nested.config

      # Fixed plugin options
      @name       = path.basename(@pluginFile, ".sh")
      @executable = !!(1 & parseInt((fs.statSync(@pluginFile).mode & parseInt("777", 8)).toString(8)[0]))
      if @enabled is "false"
        @enabled = false
      else
        @enabled = true

      unless @timeout
        # Set plugin timeout to be slightly lower than interval if possible
        @timeout = @interval - 10
        if @timeout < 10
          @timeout  = 50

      @interval = @interval * 1
      @rrd      = new RRD(
        rrdDir    : @rrdDir
        pngDir    : @pngDir
        cli       : @cli
        name      : @name
        graph     : nested.graph
        graphStore: nested.graphStore
        line      : nested.line
        lineStore : nested.lineStore
      )
      cb null

  # Loop a single plugin based on options.interval
  run: (cb) ->
    tasks = []

    # Always write rrds
    tasks.push (callback) =>
      @_execute (err) ->
        callback err

    # Optionally write pngs
    if @autoWritePng
      tasks.push (callback) =>
        @rrd.grapher (err) ->
          callback err

    # Optionally upload to s3
    if @autoUploadS3
      tasks.push (callback) =>
        @_uploadS3 (err) ->
          callback err

    async.waterfall tasks, (err) =>
      if err
        return @error("failure %s.", err)
      @info("%s task(s) for plugin %s complete", tasks.length, @name)
      cb null

  parseSeries: (stdout, stderr, cb) ->
    series = []
    cnt    = 0
    stdout.trim().split("\n").forEach (line) =>
      if line.substr(0, 1) is "#"
        return
      columns = line.trim().split(/\s+/)
      dsName  = undefined
      value   = undefined
      cnt++
      if columns.length > 1
        # Name the line by first column
        dsName = columns.shift()
        value  = columns.join(" ")
      else
        # Name the line by row-index
        dsName = cnt
        value  = columns.join(" ")

      # Sanitize and push
      series.push
        value: @rrd.rrdtool.toVal(value)
        dsName: @rrd.rrdtool.toDatasourceName(dsName)


    # If there is 1 row and no column name, name the line after the graph.
    # e.g.: 'uptime'
    if series.length is 1 and @rrd.rrdtool.isNumeric(series[0].dsName)
      unless @name
        return cb Err.new("Plugin has no name when it was needed to label simplistic series")
      series[0].dsName = @rrd.rrdtool.toDatasourceName(@name)

    cb null, series

  _execute: (cb) ->
    async.waterfall [
      (callback) =>
        # Execute plugin
        opts =
          encoding  : "utf8"
          timeout   : @timeout * 1000
          maxBuffer : 200 * 1024
          killSignal: "SIGTERM"
          cwd       : path.dirname(@pluginFile)
          env       : process.env
        exec @pluginFile, opts, (err, stdout, stderr) =>
          if err
            return callback(Err.new("Cannot execute %s. %s", @pluginFile, stderr))
          if stderr
            @error "Saw stderr while running plugin: %s", stderr
          callback err, stdout, stderr
      , (stdout, stderr, callback) =>
        # Convert output to series
        @parseSeries stdout, stderr, (err, series) ->
          return callback(err)  if err
          callback null, series
      , (series, callback) =>
        @rrd.update series, callback
    ], (err) ->
      cb err

  _uploadS3: (cb) ->
    config =
      key   : "METRIKS_S3_KEY"
      secret: "METRIKS_S3_SECRET"
      bucket: "METRIKS_S3_BUCKET"

    _.each config, (env, key) ->
      v = undefined
      unless v = process.env[env]
        return cb Err.new("Please set a %s environment var with the S3 %s ", env, key)
      config[key] = v

    client              = knox.createClient(config)
    files               = {}
    files[@rrd.pngFile] = @pngDir
    files[@rrd.rrdFile] = @rrdDir
    uploaded            = 0
    needed              = 0
    _.each files, (dir, file) ->
      if fs.existsSync(file)
        needed++
        pat     = new RegExp("^" + dir)
        dst     = file.replace(pat, "")
        headers =
          "x-amz-acl"    : "public-read"
          "storage-class": "STANDARD"

        client.putFile file, dst, headers, (err, res) ->
          if err or res.statusCode isnt 200
            return cb(Err.new("Error while uploading %s. code: %s. %s",
              file, res?.statusCode, err))
          res.resume()
          cb null  if ++uploaded >= needed

exports.Plugin = Plugin
