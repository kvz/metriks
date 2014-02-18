var _           = require('underscore');
var async       = require('async');
var exec        = require('child_process').exec;
var fs          = require('fs');
var glob        = require('glob');
var os          = require('os');
var sys         = require('sys');
var util        = require('util');
var path        = require('path');
var mkdirp      = require('mkdirp');
var RRDTool     = require('./rrdtool').RRDTool;
var unflatten   = require('flat').unflatten;

_.templateSettings = {
  interpolate: /\{(.+?)\}/g
};

exports        = module.exports = new Plugin();
exports.Plugin = Plugin;

function Plugin(config) {
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

  this.defaultConfigOptions = {
    interval  : '60',
    enabled   : true,
    executable: true,
  };

  this.defaultGraphOptions = {
    consolidation: 'AVERAGE',
    xff          : 0.5,
    step         : 1,
    rows         : 300,

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

    lines        : {}
  };

  this.defaultLineOptions = {
    dsType       : 'GAUGE',
    heartBeat    : 600,
    min          : 'U',
    max          : 'U',

    element      : 'LINE1',
    consolidation: 'AVERAGE',
  };

  // mgr config
  this.pluginFile   = null;
  this.rrdDir       = null;
  this.pngDir       = null;
  this.autoWritePng = null;
  this.cli          = {
    info:  function(str) {console.log('INFO:  ' + str); },
    debug: function(str) {console.log('DEBUG: ' + str); },
    error: function(str) {console.log('ERROR: ' + str); },
    fatal: function(str) {console.log('FATAL: ' + str); },
    ok:    function(str) {console.log('OK:    ' + str); },
  };

  _.extend(this, config);

  this.rrdtool = new RRDTool({
    cli: this.cli,
  });
}

Plugin.prototype.reload = function(cb) {
  var self = this;

  // Parse options from source's comments
  self.graph = {};

  self.cli.info(util.format(
    'Loading plugin %s. This also executes it with \'config\' parameter so you can print dynamic config. ',
    self.pluginFile
  ));

  var opts = {
    encoding  : 'utf8',
    timeout   : 10 * 1000,
    maxBuffer : 200 * 1024,
    killSignal: 'SIGTERM',
    cwd       : path.dirname(self.pluginFile),
    env       : process.ENV
  };
  exec(self.pluginFile + ' config', opts, function (err, stdout, stderr) {
    if (err) {
      var msg = '';
      msg += 'Cannot execute plugin ' + self.pluginFile   + '. ';
      msg += 'If you want to disable please set \'# config.enable: false\'. ';
      msg += stderr;
      msg += err;
      msg += stdout;
      return cb(new Error(msg));
    }

    // Parse comment header
    var flat         = {};
    var commentLines = stdout.match(/^#(.*)$/img);
    if (commentLines && commentLines.length) {
      commentLines.forEach(function(line) {
        var cfgKey   = line.match(/^#\s*([^:]+)\s*/)[1];
        var cfgVal   = line.match(/:\s*(.*)\s*$/)[1];
        flat[cfgKey] = cfgVal;
      });
    }

    // Convert flat -> structure to recursive
    var nested = unflatten(flat, {
      delimiter: '->',
      object:    true,
    });

    // Apply defaults to said config
    _.extend(self, self.defaultConfigOptions, nested.config);
    _.extend(self.graph, self.defaultGraphOptions, nested.graph);
    _.extend(self.defaultLineOptions, self.graph.lines['*']);
    delete(self.graph.lines['*']);

    // Save line properties under dsName compatible names
    var cleanLines = {};
    _.each(self.graph.lines, function(lineProperties, dsName) {
      // Merging defaults can only be done at runtime
      cleanLines[self.rrdtool.toDatasourceName(dsName)] = lineProperties;
    });
    self.graph.lines = cleanLines;

    // Fixed plugin options
    self.name       = path.basename(self.pluginFile, '.sh');
    self.executable = !!(1 & parseInt ((fs.statSync(self.pluginFile).mode & parseInt('777', 8)).toString(8)[0]));

    // Smart plugin options
    if (!self.rrdFile) {
      self.rrdFile = util.format('%s/%s-%s.rrd', self.name, os.hostname(), self.name);
    }
    if (self.rrdFile.substr(0, 1) !== '/') {
      self.rrdFile = self.rrdDir + '/' + self.rrdFile;
    }

    if (!self.pngFile) {
      self.pngFile = util.format('%s/%s-%s.png', self.name, os.hostname(), self.name);
    }
    if (self.pngFile.substr(0, 1) !== '/') {
      self.pngFile = self.pngDir + '/' + self.pngFile;
    }

    if (self.enabled === 'false') {
      self.enabled = false;
    } else {
      self.enabled = true;
    }

    if (!self.timeout) {
      // Set plugin timeout to be slightly lower than interval if possible
      self.timeout = self.interval - 10;
      if (self.timeout < 10) {
        self.timeout = 50;
      }
    }

    self.interval = self.interval * 1;

    cb(null);
  });
};

/**
 * Loop a single plugin based on options.interval
 * @param  {[type]} plugin
 */
Plugin.prototype.run = function(cb) {
  var self  = this;
  var tasks = [];

  // Always write rrds
  tasks.push(function (callback) {
    self._writeRRD(function (err, output) {
      callback(err);
    });
  });

  // Optionally write pngs
  if (self.autoWritePng) {
    tasks.push(function (callback) {
      self._writePNG(function (err, output) {
        callback(err, output);
      });
    });
  }

  async.waterfall(tasks, function (err, output) {
    if (err) {
      return self.cli.error(util.format('failure %s.', err));
    }
    self.cli.info(util.format(
      '%s task(s) for plugin %s complete',
      tasks.length,
      self.name
    ));
    cb(null);
  });
};


/**
 * Parse plugin output
 * @param  {object} plugin
 * @param  {string} output
 * @return {object}
 */
Plugin.prototype.parseSeries = function(stdout, stderr, cb) {
  var self   = this;
  var series = [];
  var cnt    = 0;
  stdout.trim().split('\n').forEach(function(line) {
    if (line.substr(0, 1) === '#') {
      return;
    }
    var columns = line.trim().split(/\s+/);
    var dsName;
    var value;
    cnt++;

    if (columns.length > 1) {
      // Name the line by first column
      dsName = columns.shift();
      value  = columns.join(' ');
    } else {
      // Name the line by row-index
      dsName = cnt;
      value  = columns.join(' ');
    }

    // Sanitize and push
    series.push({
      value: self.rrdtool.toVal(value),
      dsName  : self.rrdtool.toDatasourceName(dsName),
    });

    // console.log({
    //   line   : line,
    //   dsName    : dsName,
    //   value  : value,
    //   columns: columns,
    //   cnt    : cnt,
    // });
  });

  // If there is 1 row and no column name, name the line after the graph.
  // e.g.: 'uptime'
  if (series.length === 1 && self.rrdtool.isNumeric(series[0].dsName)) {
    if (!self.name) {
      return cb('Plugin has no name when it was needed to label simplistic series');
    }
    series[0].dsName = self.rrdtool.toDatasourceName(self.name);
  } else {
    // console.log(series);
  }

  cb(null, series);
};

Plugin.prototype._writeRRD = function(cb) {
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
      // Execute plugin
      var opts = {
        encoding  : 'utf8',
        timeout   : self.timeout * 1000,
        maxBuffer : 200 * 1024,
        killSignal: 'SIGTERM',
        cwd       : path.dirname(self.pluginFile),
        env       : process.env
      };
      exec(self.pluginFile, opts, function (err, stdout, stderr) {
        if (err) {
          return callback('Cannot execute self. ' + stderr);
        }
        if (stderr) {
          self.cli.error(util.format('Saw stderr while running plugin: ' + stderr));
        }
        callback(err, stdout, stderr);
      });
    },
    function(stdout, stderr, callback){
      // Convert output to series
      self.parseSeries(stdout, stderr, function (err, series) {
        if (err) {
          return callback(err);
        }

        callback(null, series);
      });
    },
    function(series, callback){
      // Find info
      self.rrdtool.info(self.rrdFile, [], function(err, info) {
        if (err) {
          return callback(err);
        }

        callback(null, series, info);
      });
    },
    function(series, info, callback){
      // Create rrds if needed
      var values           = [];
      var rrdCreateOptions = [];

      series.forEach(function (item) {
        var lineProperties = {};
        _.extend(lineProperties, self.defaultLineOptions, self.graph.lines[item.dsName], {
          dsName: item.dsName,
        });

        rrdCreateOptions.push(_.template('DS:{ dsName }:{ dsType }:{ heartBeat }:{ min }:{ max }')(lineProperties));
        values.push(item.value);
      });

      rrdCreateOptions.push(_.template('RRA:{ consolidation }:{ xff }:{ step }:{ rows }')(self.graph));


      if (info === null) {
        // Info is null if the rrd didn't exist yet
        self.rrdtool.create(self.rrdFile, rrdCreateOptions, function(err, output) {
          return callback(err, values);
        });
      } else {
        var datasourcesInRRD = _.keys(info.ds);

        series.forEach(function(item, seriesIndex) {
          if (datasourcesInRRD[seriesIndex] !== item.dsName) {
            return callback(util.format(
              'Plugin %s generates datasource "%s", but rrd %s holds "%s" in this location (%s). All dsnames: %s',
              self.pluginFile,
              item.dsName,
              self.rrdFile,
              datasourcesInRRD[item.dsName],
              seriesIndex,
              datasourcesInRRD.join(', ')
            ));
          }
        });

        if (series.length !== datasourcesInRRD.length) {
          return callback(util.format(
            'Plugin %s generates %s datasources, but rrd %s was created with %s. ',
            self.pluginFile,
            series.length,
            self.rrdFile,
            datasourcesInRRD.length
          ));
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
    if (err) {
      throw err;
    }

    cb(err);
  });
};

Plugin.prototype._writePNG = function (cb) {
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
        rrdGraphOptions.push(_.omit(self.graph, 'lines', 'consolidation', 'xff', 'step', 'rows'));

        // Apply theme border/canvas/font colors
        _.each(self.theme, function (themeColor, themeKey) {
          if (_.isString(themeColor)) {
            rrdGraphOptions.push('--color'); rrdGraphOptions.push(themeKey + themeColor);
          }
        });

        // Loop over each ds, merge params and push to rrdGraphOptions array
        _.keys(info.ds).forEach(function (dsName, lineIndex) {
          var lineProperties = {};
          _.extend(
            lineProperties,
            self.defaultLineOptions,
            {
              vName        : dsName + 'a',
              dsName       : dsName,
              title        : dsName,
              color        : self.theme.LINES[lineIndex],
              rrdFile      : self.rrdFile,
            },
            self.graph.lines[dsName]
          );

          rrdGraphOptions.push(_.template('DEF:{ vName }={ rrdFile }:{ dsName }:{ consolidation }')(lineProperties));
          rrdGraphOptions.push(_.template('{ element }:{ vName }{ color }:{ title }\\\\l')(lineProperties));
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
