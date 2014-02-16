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
var rrdtool     = new RRDTool();
var unflatten   = require('flat').unflatten;

_.templateSettings = {
  interpolate: /\{(.+?)\}/g
};

exports        = module.exports = new Plugin();
exports.Plugin = Plugin;

function Plugin(config) {
  this.defaultGraphOptions = {
    lineColors: [
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

  // mgr config
  this.pluginFile   = null;
  this.rrdDir       = null;
  this.pngDir       = null;
  this.autoWritePng = null;
  this.cli          = null;
  _.extend(this, config);
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
        var key   = line.match(/^#\s*([^:]+)\s*/)[1];
        var val   = line.match(/:\s*(.*)\s*$/)[1];
        flat[key] = val;
      });
    }
    var nested = unflatten(flat);


    // Apply defaults to said config
    config = _.defaults(nested.config || {}, self.defaultConfigOptions);
    graph  = _.defaults(nested.graph || {}, self.defaultGraphOptions);


    // Aply merged config to objects
    _.extend(self, config);
    _.extend(self.graph, graph);

    // Additional adding of default colors to any open slots, it's how you'd expect it to behave
    self.defaultGraphOptions.lineColors.forEach(function(color, colorIndex) {
      if (!(colorIndex in self.graph.lineColors)) {
        self.graph.lineColors[colorIndex] = self.defaultGraphOptions.lineColors[colorIndex];
      }
    });

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
    var key;
    var value;
    cnt++;

    if (columns.length > 1) {
      // Name the line by first column
      key   = columns.shift();
      value = columns.join(' ');
    } else {
      // Name the line by row-index
      key   = cnt;
      value = columns.join(' ');
    }

    // Sanitize and push
    series.push({
      value: rrdtool.toVal(value),
      key  : rrdtool.toDatasourceName(key),
    });

    // console.log({
    //   line   : line,
    //   key    : key,
    //   value  : value,
    //   columns: columns,
    //   cnt    : cnt,
    // });
  });

  // If there is 1 row and no column name, name the line after the graph.
  // e.g.: 'uptime'
  if (series.length === 1 && rrdtool.isNumeric(series[0].key)) {
    if (!self.name) {
      return cb('Plugin has no name when it was needed to label simplistic series');
    }
    series[0].key = rrdtool.toDatasourceName(self.name);
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
      rrdtool.info(self.rrdFile, [], function(err, info) {
        if (err) {
          return callback(err);
        }

        callback(null, series, info);
      });
    },
    function(series, info, callback){
      // Create rrds if needed
      var values  = [];
      var options = [];

      series.forEach(function (item) {
        options.push(_.template('DS:{key}:GAUGE:600:U:U')({
          key: item.key
        }));
        values.push(item.value);
      });

      options.push(_.template('RRA:AVERAGE:0.5:1:300')({}));


      if (info === null) {
        // Info is null if the rrd didn't exist yet
        rrdtool.create(self.rrdFile, options, function(err, output) {
          return callback(err, values);
        });
      } else {
        var datasourcesInRRD = _.keys(info.ds);

        series.forEach(function(item, i) {
          if (datasourcesInRRD[i] !== item.key) {
            return callback(util.format(
              'Plugin %s generates datasource "%s", but rrd %s holds "%s" in this location (%s). All keys: %s',
              self.pluginFile,
              item.key,
              self.rrdFile,
              datasourcesInRRD[item.key],
              i,
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
      rrdtool.update(self.rrdFile, new Date(), values, [], function(err, output) {
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
      rrdtool.info(self.rrdFile, [], function(err, info) {
        if (err) {
          return callback(err);
        }

        var graphParams = {
          title        : self.name,
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

        // Copy plugin options
        _.extend(graphParams, _.omit(self.graph, 'lineColors'));

        var options = [];
        options.push(graphParams);

        options.push('--color'); options.push(util.format('BACK%s', '#1D1D1DFF'));
        options.push('--color'); options.push(util.format('CANVAS%s', '#141414FF'));
        options.push('--color'); options.push(util.format('SHADEA%s', '#282A2AFF'));
        options.push('--color'); options.push(util.format('SHADEB%s', '#121212FF'));
        options.push('--color'); options.push(util.format('GRID%s', '#232323FF'));
        options.push('--color'); options.push(util.format('MGRID%s', '#232323EE'));
        options.push('--color'); options.push(util.format('FRAME%s', '#2A1F1CFF'));
        options.push('--color'); options.push(util.format('FONT%s', '#FFFFFFEE')); // options.push(util.format('FONT%s', '#2A1F1CFF'));
        options.push('--color'); options.push(util.format('AXIS%s', '#4A4A4AFF'));

        var useLinecolors = [];
        var dss = _.keys(info.ds);
        dss.forEach(function (key) {
          if (useLinecolors.length === 0) {
            // We need a color refil
            useLinecolors = useLinecolors.concat(self.graph.lineColors);
          }
          var dsParams = {
            col    : useLinecolors.shift(),
            descr  : rrdtool.toTitle(key),
            ds     : key,
            id     : key + 'a',
            rrdFile: self.rrdFile,
          };

          options.push(_.template('DEF:{ id }={ rrdFile }:{ ds }:AVERAGE')(dsParams));
          options.push(_.template('LINE1:{ id }{ col }:"{ descr }\\l"')(dsParams));
        });
        callback(null, options);
      });
    },
    function(options, callback) {
      rrdtool.graph(self.pngFile, options, function(err, output) {
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
