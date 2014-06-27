exec      = require("child_process").exec
unflatten = require("flat").unflatten
_         = require "underscore"
sys       = require "sys"
fs        = require "fs"
util      = require "util"

class RRDTool
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

    _.extend this, config

  escape: (args) ->

    # Escape everything that is potentially unsafe with a backslash
    # return (argument+'').trim().replace(/([^0-9a-zA-Z-])/g, '\\$1');
    # rrdtool requires different escaping
    Array::slice.call(args).map((argument) ->
      argument = ""  if argument is `undefined` or argument is null
      return "''"  if argument is ""
      (argument + "").trim().replace /([^0-9a-zA-Z-\\\"\_\.\/\:])/g, "\\$1"
    ).join " "

  exe: (cmd, options, cb) ->
    self = this
    args = []
    args.push cmd
    options.forEach (val, key) ->
      if _.isObject(val)
        _.each val, (subVal, subKey) ->
          return  if subVal is false or subVal is "false"
          if subKey.length is 1
            args.push "-" + subKey
          else
            args.push "--" + subKey.replace(/([A-Z])/g, "-$1").toLowerCase()
          return  if subVal is true or subVal is "true"
          args.push subVal + ""

        return
      args.push val + ""

    fullCmd = "rrdtool " + self.escape(args)
    self.cli.debug fullCmd
    opts =
      encoding: "utf8"
      timeout: 50 * 1000
      maxBuffer: 200 * 1024
      killSignal: "SIGTERM"

    exec fullCmd, opts, (err, stdout, stderr) ->
      return cb(new Error(util.format("Error while executing %s. %s. stderr: %s", fullCmd, err, stderr)))  if err isnt null or stderr
      cb null, stdout


  ###
  Different from _.defaults because this goes over the option
  Array to apply missing Object properties
  @param  {[type]} options     [description]
  @param  {[type]} defaultOpts [description]
  @return {[type]}             [description]
  ###
  _default: (options, defaultOpts) ->
    defaultKeys = _.keys(defaultOpts)
    hasKeys = []
    _.each defaultOpts, (defaultVal, defaultKey) ->
      found = false
      options.forEach (val, key) ->
        if _.isObject(val)
          _.each val, (subVal, subKey) ->
            if subKey is defaultKey
              found = true
              return

      options[defaultKey] = defaultVal  unless found

    options

  create: (rrdFile, options, cb) ->
    self = this
    options = options or []
    options.unshift rrdFile
    options = self._default(options,
      start: new Date()
      step : 300
    )
    self.exe "create", options, cb

  update: (rrdFile, time, values, options, cb) ->
    self = this
    options = options or []
    options.unshift rrdFile
    options.push self.rrdTime(time) + ":" + values.join(":")
    self.exe "update", options, cb

  graph: (pngFile, options, cb) ->
    self = this
    options = options or []
    options.unshift pngFile
    self.exe "graph", options, cb

  info: (rrdFile, options, cb) ->
    self = this
    options = options or []
    options.unshift rrdFile
    unless fs.existsSync(rrdFile)

      # rrd file doesn not exist (yet)
      self.cli.debug "rrd file doesn not exist (yet) " + rrdFile
      return cb(null, null)
    self.exe "info", options, (err, stdout) ->
      return cb(err)  if err
      info = self.explodeTree(stdout)
      unless "ds" of info
        self.cli.debug
          rrdFile: rrdFile
          info: info
          stdout: stdout

        return cb(new Error(util.format("No ds found in info for %s", rrdFile)))
      cb null, info


  explodeTree: (buf) ->
    self = this
    flat = {}
    buf.split("\n").forEach (line) ->
      parts = line.split(" = ")
      rawKey = parts.shift()
      rawVal = parts.join(" = ")
      key = rawKey.replace(/[\.\[\]]+/g, ".").replace(/^\[/, "").replace(/\]$/, "")
      flat[key] = self.toVal(rawVal)

    unflatten flat

  toVal: (val) ->
    self = this
    if self.isNumeric(val)
      val = val * 1
    else
      val = (val + "").trim()
      val = val.replace(/(^"|"$)/g, "")  if val.substr(0, 1) is "\"" and val.substr(-1) is "\""
    val


  ###
  isNumeric is something else than isNumber. We also allow strings posing as numbers.
  @param  {[type]}  n [description]
  @return {Boolean}   [description]
  ###
  isNumeric: (n) ->
    not isNaN(parseFloat(n)) and isFinite(n)

  rrdTime: (date) ->
    Math.round date.valueOf() / 1000

  toLineTitle: (str) ->
    str = (str + "").replace(/[^a-zA-Z0-9_ \.\/]/g, "")
    str = (str).replace(/\s+/g, " ")
    str

  toDSTitle: (str) ->
    # An rrd ds name can only be 19 chars long
    str = (str + "").replace(/[^a-zA-Z0-9_ ]/g, "")
    str = (str).replace(/\s+/g, " ")
    str.substr 0, 19

  toDatasourceName: (str) ->
    # An rrd ds name can only be 19 chars long
    str = (str + "").replace(/[^a-zA-Z0-9_]/g, "_")
    str.substr 0, 19

exports.RRDTool = RRDTool
