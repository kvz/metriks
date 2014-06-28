exec    = require("child_process").exec
RRDTool = require("./rrdtool").RRDTool
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
Err     = require("./base").ErrorFmt
_.templateSettings = interpolate: /\{(.+?)\}/g

class RRD extends Base
  theme:
    BACK  : "#1D1D1DFF"
    CANVAS: "#141414FF"
    SHADEA: "#282A2AFF"
    SHADEB: "#121212FF"
    GRID  : "#232323FF"
    MGRID : "#232323EE"
    FRAME : "#2A1F1CFF"
    FONT  : "#FFFFFFEE"
    AXIS  : "#4A4A4AFF"
    LINES : [
      "#44B824FF"
      "#E992ECFF"
      "#FF0051FF"
      "#9AEBEAFF"
      "#D73A3FFF"
      "#44B824FF"
      "#6384B3FF"
      "#2F4D5DFF"
      "#E1E3EAFF"
      "#7F9B8BFF"
      "#FDFFA8FF"
      "#C7D5AEFF"
      "#8E7F57FF"
      "#FBFFF2FF"
      "#CF492CFF"
      "#9863B6FF"
      "#EF8E1CFF"
      "#45B175FF"
      "#3A96D0FF"
    ]

  defaultGraphStore:
    consolidation: "AVERAGE"
    xff          : 0.5
    step         : 1
    rows         : 300

  defaultGraph:
    width        : 1000
    height       : 600
    watermark    : "kvz.io"
    font         : "DEFAULT:10:Inconsolata"
    tabwidth     : 20
    border       : 2
    zoom         : 1
    fullSizeMode : true
    dynamicLabels: true
    slopeMode    : true
    end          : "now"
    start        : "end-120000s"
    verticalLabel: ""

  defaultLineStore:
    dsType       : "GAUGE"
    consolidation: "AVERAGE"
    heartBeat    : 600
    min          : "U"
    max          : "U"

  defaultLine: element: "LINE1"
  name       : ""
  graph      : {}
  graphStore : {}
  line       : {}
  lineStore  : {}
  rrdDir     : null
  pngDir     : null
  rrdFile    : null
  pngFile    : null

  _setup: (config) ->
    super config
    @rrdtool = new RRDTool(cli: @cli)
    @graph   = {}
    _.extend @graph, @defaultGraph, config.graph
    @graphStore = {}
    _.extend @graphStore, @defaultGraphStore, config.graphStore

    # Allow complementing line defaults using wildcards
    if config.line
      _.extend @defaultLine, config.line["*"]
      delete config.line["*"]
    if config.lineStore
      _.extend @defaultLineStore, config.lineStore["*"]
      delete config.lineStore["*"]

    # Save line properties under dsName compatible names
    cleanLine = {}
    _.each config.line, (lineProperties, dsName) ->
      # Merging defaults can only be done at runtime
      cleanDsName = (dsName + "").replace(/[^a-zA-Z0-9_]/g, "_").substr(0, 19)
      cleanLine[cleanDsName] = lineProperties

    @line = cleanLine

    # Save lineStore properties under dsName compatible names
    cleanLineStore = {}
    _.each config.lineStore, (lineProperties, dsName) ->
      # Merging defaults can only be done at runtime
      cleanDsName = (dsName + "").replace(/[^a-zA-Z0-9_]/g, "_").substr(0, 19)
      cleanLineStore[cleanDsName] = lineProperties

    @lineStore = cleanLineStore

    # Smart options
    if not @rrdFile
      @rrdFile = @fmt("%s/%s-%s.rrd", @name, os.hostname(), @name)
    if @rrdFile.substr(0, 1) isnt "/"
      @rrdFile = @rrdDir + "/" + @rrdFile
    if not @pngFile
      @pngFile = @fmt("%s/%s-%s.png", @name, os.hostname(), @name)
    if @pngFile.substr(0, 1) isnt "/"
      @pngFile = @pngDir + "/" + @pngFile

  _validate: (config) ->
    if not config.rrdDir
      return "Please set the rrdDir"
    if not config.pngDir
      return "Please set the pngDir"
    return true

  _mkdir: (cb) ->
    rrdDir = path.dirname(@rrdFile)
    if fs.existsSync(rrdDir)
      return cb(null)
    @info("Creating directory %s", rrdDir)
    mkdirp rrdDir, (err) ->
      if err
        return cb(err)
      cb null

  _findInfo: (cb) ->
    @rrdtool.info @rrdFile, [], (err, info) ->
      if err
        return cb(err)
      cb null, info
      return

  _create: (series, info, cb) ->
    values           = []
    rrdCreateOptions = []
    series.forEach (item, lineIndex) =>
      rrdCreateOptions.push _.template("DS:{ dsName }:{ dsType }:{ heartBeat }:{ min }:{ max }")(@getLineStore(item.dsName, lineIndex))
      values.push item.value

    rrdCreateOptions.push _.template("RRA:{ consolidation }:{ xff }:{ step }:{ rows }")(@graphStore)
    if info is null
      # Info is null if the rrd didn't exist yet
      @rrdtool.create @rrdFile, rrdCreateOptions, (err, output) ->
        cb err, values
    else
      datasourcesInRRD = _.keys(info.ds)
      series.forEach (item, seriesIndex) ->
        if datasourcesInRRD[seriesIndex] isnt item.dsName
          return cb Err.new("Something generates datasource \"%s\", but rrd %s holds \"%s\" in this location (%s). All dsNames: %s", 
            item.dsName, @rrdFile, datasourcesInRRD[item.dsName], seriesIndex, datasourcesInRRD.join(", "))

      if series.length isnt datasourcesInRRD.length
        return cb Err.new("Something generates %s datasources, but rrd %s was created with %s. ",
          series.length, @rrdFile, datasourcesInRRD.length)
      return cb(null, values)

  _update: (values, cb) ->
    # Update rrd with series
    @rrdtool.update @rrdFile, new Date(), values, [], (err, output) ->
      cb null

  update: (series, cb) ->
    @_mkdir =>
      @_findInfo (err, info) =>
        @_create series, info, (err, values) =>
          @_update values, (err) =>
            cb err

  getLineStore: (dsName, lineIndex) ->
    dsName    = @rrdtool.toDatasourceName(dsName)
    lineStore = {}
    _.extend lineStore, @defaultLineStore,
      vName: dsName + "a"
      rrdFile: @rrdFile
    , @lineStore[dsName],
      dsName: dsName

    lineStore

  getLine: (dsName, lineIndex) ->
    dsName = @rrdtool.toDatasourceName(dsName)
    line   = {}
    _.extend line, @defaultLine,
      vName: dsName + "a"
      title: dsName
      color: @theme.LINES[lineIndex]
    , @line[dsName]
    line

  grapher: (cb) =>
    async.waterfall [
      (callback) =>
        # Mkdir
        pngDir = path.dirname(@pngFile)
        return callback(null)  if fs.existsSync(pngDir)
        @info("Creating directory %s", pngDir)
        mkdirp pngDir, (err) ->
          return callback(err)  if err
          callback null

      , (callback) =>
        @rrdtool.info @rrdFile, [], (err, info) =>
          return callback(err)  if err

          # Leave out any graph object property that's not a true rrd graph parameter
          rrdGraphOptions = []
          rrdGraphOptions.push @graph

          # Apply theme border/canvas/font colors
          _.each @theme, (themeColor, themeKey) =>
            if _.isString(themeColor)
              rrdGraphOptions.push "--color"
              rrdGraphOptions.push themeKey + themeColor

          # Loop over each ds, merge params and push to rrdGraphOptions array
          _.keys(info.ds).forEach (dsName, lineIndex) =>
            rrdGraphOptions.push _.template("DEF:{ vName }={ rrdFile }:{ dsName }:{ consolidation }")(@getLineStore(dsName, lineIndex))
            rrdGraphOptions.push _.template("{ element }:{ vName }{ color }:{ title }\\\\l")(@getLine(dsName, lineIndex))

          callback null, rrdGraphOptions
          return

      , (rrdGraphOptions, callback) =>
        @rrdtool.graph @pngFile, rrdGraphOptions, (err, output) ->
          return callback(err)  if err
          callback null

    ], (err) ->
      cb err

exports.RRD = RRD
