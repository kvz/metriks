exec               = require("child_process").exec
RRDTool            = require("./rrdtool").RRDTool
_                  = require "underscore"
async              = require "async"
fs                 = require "fs"
glob               = require "glob"
os                 = require "os"
sys                = require "sys"
util               = require "util"
path               = require "path"
mkdirp             = require "mkdirp"
_.templateSettings = interpolate: /\{(.+?)\}/g

class RRD
  constructor: (config) ->
    @theme =
      BACK: "#1D1D1DFF"
      CANVAS: "#141414FF"
      SHADEA: "#282A2AFF"
      SHADEB: "#121212FF"
      GRID: "#232323FF"
      MGRID: "#232323EE"
      FRAME: "#2A1F1CFF"
      FONT: "#FFFFFFEE"
      AXIS: "#4A4A4AFF"
      LINES: [
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

    @defaultGraphStore =
      consolidation: "AVERAGE"
      xff: 0.5
      step: 1
      rows: 300

    @defaultGraph =
      width: 1000
      height: 600
      watermark: "kvz.io"
      font: "DEFAULT:10:Inconsolata"
      tabwidth: 20
      border: 2
      zoom: 1
      fullSizeMode: true
      dynamicLabels: true
      slopeMode: true
      end: "now"
      start: "end-120000s"
      verticalLabel: ""

    @defaultLineStore =
      dsType: "GAUGE"
      consolidation: "AVERAGE"
      heartBeat: 600
      min: "U"
      max: "U"

    @defaultLine = element: "LINE1"
    @name = ""
    @graph = {}
    @graphStore = {}
    @line = {}
    @lineStore = {}
    @rrdDir = null
    @pngDir = null
    @rrdFile = null
    @pngFile = null

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


    # Merge passed config
    _.extend this, config
    @rrdtool = new RRDTool(cli: @cli)
    @graph = {}
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
      return

    @line = cleanLine

    # Save lineStore properties under dsName compatible names
    cleanLineStore = {}
    _.each config.lineStore, (lineProperties, dsName) ->

      # Merging defaults can only be done at runtime
      cleanDsName = (dsName + "").replace(/[^a-zA-Z0-9_]/g, "_").substr(0, 19)
      cleanLineStore[cleanDsName] = lineProperties
      return

    @lineStore = cleanLineStore

    # Smart options
    @rrdFile = util.format("%s/%s-%s.rrd", @name, os.hostname(), @name)  unless @rrdFile
    @rrdFile = @rrdDir + "/" + @rrdFile  if @rrdFile.substr(0, 1) isnt "/"
    @pngFile = util.format("%s/%s-%s.png", @name, os.hostname(), @name)  unless @pngFile
    @pngFile = @pngDir + "/" + @pngFile  if @pngFile.substr(0, 1) isnt "/"
    throw new Error("Please set the rrdDir")  unless @rrdDir
    throw new Error("Please set the pngDir")  unless @pngDir
    return

  update: (series, cb) ->
    self = this
    async.waterfall [
      (callback) ->

        # Mkdir
        rrdDir = path.dirname(self.rrdFile)
        return callback(null)  if fs.existsSync(rrdDir)
        self.cli.info util.format("Creating directory %s", rrdDir)
        mkdirp rrdDir, (err) ->
          return callback(err)  if err
          callback null

      (callback) ->

        # Find info
        self.rrdtool.info self.rrdFile, [], (err, info) ->
          return callback(err)  if err
          callback null, info
          return

      (info, callback) ->

        # Create rrds if needed
        values = []
        rrdCreateOptions = []
        series.forEach (item, lineIndex) ->
          rrdCreateOptions.push _.template("DS:{ dsName }:{ dsType }:{ heartBeat }:{ min }:{ max }")(self.getLineStore(item.dsName, lineIndex))
          values.push item.value
          return

        rrdCreateOptions.push _.template("RRA:{ consolidation }:{ xff }:{ step }:{ rows }")(self.graphStore)
        if info is null

          # Info is null if the rrd didn't exist yet
          self.rrdtool.create self.rrdFile, rrdCreateOptions, (err, output) ->
            callback err, values

        else
          datasourcesInRRD = _.keys(info.ds)
          series.forEach (item, seriesIndex) ->
            callback new Error(util.format("Something generates datasource \"%s\", but rrd %s holds \"%s\" in this location (%s). All dsNames: %s", item.dsName, self.rrdFile, datasourcesInRRD[item.dsName], seriesIndex, datasourcesInRRD.join(", ")))  if datasourcesInRRD[seriesIndex] isnt item.dsName

          return callback(new Error(util.format("Something generates %s datasources, but rrd %s was created with %s. ", series.length, self.rrdFile, datasourcesInRRD.length)))  if series.length isnt datasourcesInRRD.length
          return callback(null, values)
      (values, callback) ->

        # Update rrd with series
        self.rrdtool.update self.rrdFile, new Date(), values, [], (err, output) ->
          callback null
          return

    ], (err) ->
      cb err
      return

    return

  getLineStore: (dsName, lineIndex) ->
    self = this
    dsName = self.rrdtool.toDatasourceName(dsName)
    lineStore = {}
    _.extend lineStore, self.defaultLineStore,
      vName: dsName + "a"
      rrdFile: self.rrdFile
    , self.lineStore[dsName],
      dsName: dsName

    lineStore

  getLine: (dsName, lineIndex) ->
    self = this
    dsName = self.rrdtool.toDatasourceName(dsName)
    line = {}
    _.extend line, self.defaultLine,
      vName: dsName + "a"
      title: dsName
      color: self.theme.LINES[lineIndex]
    , self.line[dsName]
    line

  grapher: (cb) ->
    self = this
    async.waterfall [
      (callback) ->

        # Mkdir
        pngDir = path.dirname(self.pngFile)
        return callback(null)  if fs.existsSync(pngDir)
        self.cli.info util.format("Creating directory %s", pngDir)
        mkdirp pngDir, (err) ->
          return callback(err)  if err
          callback null

      (callback) ->
        self.rrdtool.info self.rrdFile, [], (err, info) ->
          return callback(err)  if err

          # Leave out any graph object property that's not a true rrd graph parameter
          rrdGraphOptions = []
          rrdGraphOptions.push self.graph

          # Apply theme border/canvas/font colors
          _.each self.theme, (themeColor, themeKey) ->
            if _.isString(themeColor)
              rrdGraphOptions.push "--color"
              rrdGraphOptions.push themeKey + themeColor
            return


          # Loop over each ds, merge params and push to rrdGraphOptions array
          _.keys(info.ds).forEach (dsName, lineIndex) ->
            rrdGraphOptions.push _.template("DEF:{ vName }={ rrdFile }:{ dsName }:{ consolidation }")(self.getLineStore(dsName, lineIndex))
            rrdGraphOptions.push _.template("{ element }:{ vName }{ color }:{ title }\\\\l")(self.getLine(dsName, lineIndex))
            return

          callback null, rrdGraphOptions
          return

      (rrdGraphOptions, callback) ->
        self.rrdtool.graph self.pngFile, rrdGraphOptions, (err, output) ->
          return callback(err)  if err
          callback null
          return

    ], (err) ->
      cb err
      return

    return

exports.RRD = RRD
