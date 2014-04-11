var _         = require('underscore');
var async     = require('async');
var exec      = require('child_process').exec;
var fs        = require('fs');
var glob      = require('glob');
var os        = require('os');
var sys       = require('sys');
var util      = require('util');
var path      = require('path');
var mkdirp    = require('mkdirp');
var RRDTool   = require('./rrdtool').RRDTool;

_.templateSettings = {
  interpolate: /\{(.+?)\}/g
};

exports.RRD = RRD;

function RRD(config) {
  this.theme = {
    'BACK'  : '#1D1D1DFF',
    'CANVAS': '#141414FF',
    'SHADEA': '#282A2AFF',
    'SHADEB': '#121212FF',
    'GRID'  : '#232323FF',
    'MGRID' : '#232323EE',
    'FRAME' : '#2A1F1CFF',
    'FONT'  : '#FFFFFFEE',
    'AXIS'  : '#4A4A4AFF',
    'LINES' : [
      '#44B824FF',
      '#E992ECFF',
      '#FF0051FF',
      '#9AEBEAFF',
      '#D73A3FFF',
      '#44B824FF',
      '#6384B3FF',
      '#2F4D5DFF',
      '#E1E3EAFF',
      '#7F9B8BFF',
      '#FDFFA8FF',
      '#C7D5AEFF',
      '#8E7F57FF',
      '#FBFFF2FF',
      '#CF492CFF',
      '#9863B6FF',
      '#EF8E1CFF',
      '#45B175FF',
      '#3A96D0FF'
    ]
  };

  this.defaultGraphStore = {
    consolidation: 'AVERAGE',
    xff          : 0.5,
    step         : 1,
    rows         : 300,
  };

  this.defaultGraph = {
    width        : 1000,
    height       : 600,
    watermark    : 'kvz.io',
    font         : 'DEFAULT:10:Inconsolata',
    tabwidth     : 20,
    border       : 2,
    zoom         : 1,
    fullSizeMode : true,
    dynamicLabels: true,
    slopeMode    : true,
    end          : 'now',
    start        : 'end-120000s',
    verticalLabel: '',
  };

  this.defaultLineStore = {
    dsType       : 'GAUGE',
    consolidation: 'AVERAGE',
    heartBeat    : 600,
    min          : 'U',
    max          : 'U',
  };

  this.defaultLine = {
    element: 'LINE1',
  };

  this.name       = '';

  this.graph      = {};
  this.graphStore = {};
  this.line       = {};
  this.lineStore  = {};

  this.rrdDir  = null;
  this.pngDir  = null;

  this.rrdFile = null;
  this.pngFile = null;

  // mgr config
  this.cli          = {
    info:  function(str) {console.log('INFO:  ' + str); },
    debug: function(str) {console.log('DEBUG: ' + str); },
    error: function(str) {console.log('ERROR: ' + str); },
    fatal: function(str) {console.log('FATAL: ' + str); },
    ok:    function(str) {console.log('OK:    ' + str); },
  };

  // Merge passed config
  _.extend(this, config);

  this.rrdtool = new RRDTool({
    cli: this.cli,
  });

  this.graph = {};
  _.extend(this.graph, this.defaultGraph, config.graph);
  this.graphStore = {};
  _.extend(this.graphStore, this.defaultGraphStore, config.graphStore);

  // Allow complementing line defaults using wildcards
  if (config.line) {
    _.extend(this.defaultLine, config.line['*']);
    delete config.line['*'];
  }
  if (config.lineStore) {
    _.extend(this.defaultLineStore, config.lineStore['*']);
    delete config.lineStore['*'];
  }

  // Save line properties under dsName compatible names
  var cleanLine = {};
  _.each(config.line, function(lineProperties, dsName) {
    // Merging defaults can only be done at runtime
    var cleanDsName = (dsName + '').replace(/[^a-zA-Z0-9_]/g, '_').substr(0, 19);
    cleanLine[cleanDsName] = lineProperties;
  });
  this.line = cleanLine;

  // Save lineStore properties under dsName compatible names
  var cleanLineStore = {};
  _.each(config.lineStore, function(lineProperties, dsName) {
    // Merging defaults can only be done at runtime
    var cleanDsName = (dsName + '').replace(/[^a-zA-Z0-9_]/g, '_').substr(0, 19);
    cleanLineStore[cleanDsName] = lineProperties;
  });
  this.lineStore = cleanLineStore;

  // Smart options
  if (!this.rrdFile) {
    this.rrdFile = util.format('%s/%s-%s.rrd', this.name, os.hostname(), this.name);
  }
  if (this.rrdFile.substr(0, 1) !== '/') {
    this.rrdFile = this.rrdDir + '/' + this.rrdFile;
  }
  if (!this.pngFile) {
    this.pngFile = util.format('%s/%s-%s.png', this.name, os.hostname(), this.name);
  }
  if (this.pngFile.substr(0, 1) !== '/') {
    this.pngFile = this.pngDir + '/' + this.pngFile;
  }

  if (!this.rrdDir) {
    throw new Error('Please set the rrdDir');
  }
  if (!this.pngDir) {
    throw new Error('Please set the pngDir');
  }
}

RRD.prototype.update = function(series, cb) {
  var self = this;

  async.waterfall([
    function(callback) {
      // Mkdir
      var rrdDir = path.dirname(self.rrdFile);
      if (fs.existsSync(rrdDir)) {
        return callback(null);
      }

      self.cli.info(util.format('Creating directory %s', rrdDir));
      mkdirp(rrdDir, function (err) {
        if (err) {
          return callback(err);
        }

        return callback(null);
      });
    },
    function(callback){
      // Find info
      self.rrdtool.info(self.rrdFile, [], function(err, info) {
        if (err) {
          return callback(err);
        }

        callback(null, info);
      });
    },
    function(info, callback){
      // Create rrds if needed
      var values           = [];
      var rrdCreateOptions = [];

      series.forEach(function (item, lineIndex) {
        rrdCreateOptions.push(_.template('DS:{ dsName }:{ dsType }:{ heartBeat }:{ min }:{ max }')(self.getLineStore(item.dsName, lineIndex)));
        values.push(item.value);
      });

      rrdCreateOptions.push(_.template('RRA:{ consolidation }:{ xff }:{ step }:{ rows }')(self.graphStore));

      if (info === null) {
        // Info is null if the rrd didn't exist yet
        self.rrdtool.create(self.rrdFile, rrdCreateOptions, function(err, output) {
          return callback(err, values);
        });
      } else {
        var datasourcesInRRD = _.keys(info.ds);

        series.forEach(function(item, seriesIndex) {
          if (datasourcesInRRD[seriesIndex] !== item.dsName) {
            return callback(new Error(util.format(
              'Something generates datasource "%s", but rrd %s holds "%s" in this location (%s). All dsNames: %s',
              item.dsName,
              self.rrdFile,
              datasourcesInRRD[item.dsName],
              seriesIndex,
              datasourcesInRRD.join(', ')
            )));
          }
        });

        if (series.length !== datasourcesInRRD.length) {
          return callback(new Error(util.format(
            'Something generates %s datasources, but rrd %s was created with %s. ',
            series.length,
            self.rrdFile,
            datasourcesInRRD.length
          )));
        }

        return callback(null, values);
      }
    },
    function(values, callback){
      // Update rrd with series
      self.rrdtool.update(self.rrdFile, new Date(), values, [], function(err, output) {
        callback(null);
      });
    }
  ], function (err) {
    cb(err);
  });
};

RRD.prototype.getLineStore = function (dsName, lineIndex) {
  var self = this;
  dsName   = self.rrdtool.toDatasourceName(dsName);

  var lineStore = {};
  _.extend(
    lineStore,
    self.defaultLineStore,
    {
      vName  : dsName + 'a',
      rrdFile: self.rrdFile,
    },
    self.lineStore[dsName],
    {
      dsName : dsName,
    }
  );

  return lineStore;
};

RRD.prototype.getLine = function (dsName, lineIndex) {
  var self = this;
  dsName   = self.rrdtool.toDatasourceName(dsName);

  var line = {};
  _.extend(
    line,
    self.defaultLine,
    {
      vName: dsName + 'a',
      title: dsName,
      color: self.theme.LINES[lineIndex],
    },
    self.line[dsName]
  );

  return line;
};

RRD.prototype.grapher = function (cb) {
  var self = this;

  async.waterfall([
    function(callback) {
      // Mkdir
      var pngDir = path.dirname(self.pngFile);
      if (fs.existsSync(pngDir)) {
        return callback(null);
      }

      self.cli.info(util.format('Creating directory %s', pngDir));
      mkdirp(pngDir, function (err) {
        if (err) {
          return callback(err);
        }

        return callback(null);
      });
    },
    function (callback) {
      self.rrdtool.info(self.rrdFile, [], function(err, info) {
        if (err) {
          return callback(err);
        }

        // Leave out any graph object property that's not a true rrd graph parameter
        var rrdGraphOptions = [];
        rrdGraphOptions.push(self.graph);

        // Apply theme border/canvas/font colors
        _.each(self.theme, function (themeColor, themeKey) {
          if (_.isString(themeColor)) {
            rrdGraphOptions.push('--color');
            rrdGraphOptions.push(themeKey + themeColor);
          }
        });

        // Loop over each ds, merge params and push to rrdGraphOptions array
        _.keys(info.ds).forEach(function (dsName, lineIndex) {
          rrdGraphOptions.push(_.template('DEF:{ vName }={ rrdFile }:{ dsName }:{ consolidation }')(self.getLineStore(dsName, lineIndex)));
          rrdGraphOptions.push(_.template('{ element }:{ vName }{ color }:{ title }\\\\l')(self.getLine(dsName, lineIndex)));
        });

        callback(null, rrdGraphOptions);
      });
    },
    function(rrdGraphOptions, callback) {
      self.rrdtool.graph(self.pngFile, rrdGraphOptions, function(err, output) {
        if (err) {
          return callback(err);
        }

        callback(null);
      });
    }
  ], function(err) {
    cb(err);
  });
};
