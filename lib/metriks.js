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

exports         = module.exports = new Metriks();
exports.Metriks = Metriks;

function Metriks(config) {
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
    interval: '60',
    enabled: true,
    executable: true,
  };

  this._q        = {};
  this.concurrency = 2;
  this.pluginDir = '/tmp';
  this.rrdDir    = '/tmp';
  this._timers   = [];
  _.extend(this, config);
}

Metriks.prototype.search = function (pattern, plugins) {
  var found = null;

  plugins.forEach(function (plugin) {
    if (plugin.rrdFile === pattern) {
      found = plugin;
      return;
    }
    if (plugin.name === pattern) {
      found = plugin;
      return;
    }
  });

  return found;
};

Metriks.prototype.graph = function (pattern) {
  var self = this;
  self._loadAllPlugins(function(err, plugins) {
    if (err) {
      throw err;
    }

    var plugin = self.search(pattern, plugins);
    self._writePNG(plugin, function (err) {
      if (err) {
        throw err;
      }

      self.cli.info(util.format('open %s', plugin.pngFile));
    });
  });
};

Metriks.prototype._writePNG = function (plugin, cb) {
  var self = this;

  async.waterfall([
    function(callback) {
      // Mkdir
      var pngDir = path.dirname(plugin.pngFile);
      if (fs.existsSync(pngDir)) {
        return callback(null, plugin);
      }

      self.cli.info(util.format('Creating directory %s', pngDir));
      mkdirp(pngDir, function (err) {
        if (err) {
          return callback(err);
        }

        return callback(null, plugin);
      });
    },
    function (plugin, callback) {
      rrdtool.info(plugin.rrdFile, [], function(err, info) {
        if (err) {
          return callback(err);
        }

        var graphParams = {
          title: plugin.name,
          width: 1000,
          height: 600,
          watermark: 'kvz.io',
          font: 'DEFAULT:10:Inconsolata',
          tabwidth: 20,
          border: 2,
          zoom: 1,
          fullSizeMode: true,
          dynamicLabels: true,
          slopeMode: true,
          end: 'now',
          start: 'end-120000s',
          verticalLabel: '',
        };

        // Copy plugin options
        _.extend(graphParams, _.omit(plugin.graph, 'lineColors'));

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
            useLinecolors = useLinecolors.concat(plugin.graph.lineColors);
          }
          var dsParams = {
            col    : useLinecolors.shift(),
            descr  : rrdtool.toTitle(key),
            ds     : key,
            id     : key + 'a',
            rrdFile: plugin.rrdFile,
          };

          options.push(_.template('DEF:{ id }={ rrdFile }:{ ds }:AVERAGE')(dsParams));
          options.push(_.template('LINE1:{ id }{ col }:"{ descr }\\l"')(dsParams));
        });
        callback(null, plugin, options);
      });
    },
    function(plugin, options, callback) {
      rrdtool.graph(plugin.pngFile, options, function(err, output) {
        if (err) {
          return callback(err, plugin);
        }

        callback(null, plugin);
      });
    }
  ], function(err, plugin) {
    cb(err, plugin);
  });
};

Metriks.prototype.start = function (rrdFile) {
  var self = this;
  self._loadAllPlugins(function(err, plugins) {
    if (err) {
      throw err;
    }

    plugins.forEach(function(plugin) {
      // Loop plugin
      if (!plugin.executable) {
        self.cli.debug(util.format('Skipping plugin %s as it is not executable', plugin.name));
        return;
      }
      if (!plugin.enabled) {
        self.cli.debug(util.format('Skipping plugin %s as it is not enabled', plugin.name));
        return;
      }

      self._q = async.queue(function(plugin, cb) {
        // We need to pass on `self`
        self._runPlugin(self, plugin, cb);
      }, self.concurrency);
      self._q.drain = function() {
        self.cli.debug(util.format('waiting for new items to be pushed to queue'));
      };
      self._q.push(plugin);
    });
  });
};

/**
 * Clear all timers
 */
Metriks.prototype.stop = function () {
  for (var i in self._timers) {
    clearTimeout(self._timers[i]);
  }
};

/**
 * Parse plugin output
 * @param  {object} plugin
 * @param  {string} output
 * @return {object}
 */
Metriks.prototype._toSeries = function(plugin, stdout, stderr, cb) {
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
      key: rrdtool.toDatasourceName(key),
    });
  });

  // If there is 1 row and no column name, name the line after the graph.
  // e.g.: 'uptime'
  if (series.length === 1 && rrdtool.isNumeric(series[0].key)) {
    series[0].key = rrdtool.toDatasourceName(plugin.name);
  } else {
    console.log(series);
  }

  cb(null, series);
};

/**
 * Run a single plugin
 * @param {object} plugin
 */
Metriks.prototype._writeRRD = function(plugin, cb) {
  var self = this;

  async.waterfall([
    function(callback) {
      // Mkdir
      var rrdDir = path.dirname(plugin.rrdFile);
      if (fs.existsSync(rrdDir)) {
        return callback(null, plugin);
      }

      self.cli.info(util.format('Creating directory %s', rrdDir));
      mkdirp(rrdDir, function (err) {
        if (err) {
          return callback(err);
        }

        return callback(null, plugin);
      });
    },
    function(plugin, callback){
      // Set plugin timeout to be slightly lower than interval is possible
      var timeout = plugin.interval - 10;
      if (timeout < 10) {
        timeout = 50;
      }

      // Execute plugin
      var opts = {
        encoding: 'utf8',
        timeout: timeout * 1000,
        maxBuffer: 200 * 1024,
        killSignal: 'SIGTERM',
        cwd: path.dirname(plugin.pluginFile),
        env: process.env
      };
      exec(plugin.pluginFile, opts, function (err, stdout, stderr) {
        if (err) {
          return callback('Cannot execute plugin. ' + stderr);
        }
        if (stderr) {
          self.cli.error(util.format('Saw stderr while running plugin: ' + stderr));
        }
        callback(err, plugin, stdout, stderr);
      });
    },
    function(plugin, stdout, stderr, callback){
      // Convert output to series
      Metriks.prototype._toSeries(plugin, stdout, stderr, function (err, series) {
        if (err) {
          return callback(err);
        }

        callback(null, plugin, series);
      });
    },
    function(plugin, series, callback){
      // Find info
      rrdtool.info(plugin.rrdFile, [], function(err, info) {
        if (err) {
          return callback(err);
        }

        callback(null, plugin, series, info);
      });
    },
    function(plugin, series, info, callback){
      // Create rrds if needed
      var values  = [];
      var options = [];

      series.forEach(function (item) {
        options.push(_.template('DS:{ key }:GAUGE:600:U:U')({
          key: item.key
        }));
        values.push(item.value);
      });

      options.push(_.template('RRA:AVERAGE:0.5:1:300')({}));

      if (info === null) {
        // Info is null if the rrd didn't exist yet
        rrdtool.create(plugin.rrdFile, options, function(err, output) {
          return callback(err, plugin, values);
        });
      } else {
        var datasourcesInRRD = _.keys(info.ds);

        series.forEach(function(item, i) {
          if (datasourcesInRRD[i] !== item.key) {
            return callback(util.format(
              'Plugin %s generates datasource "%s", but rrd %s hold "%s" in this location. ',
              plugin.pluginFile,
              item.key,
              plugin.rrdFile,
              datasourcesInRRD[item.key]
            ));
          }
        });

        if (series.length !== datasourcesInRRD.length) {
          return callback(util.format(
            'Plugin %s generates %s datasources, but rrd %s was created with %s. ',
            plugin.pluginFile,
            series.length,
            plugin.rrdFile,
            datasourcesInRRD.length
          ));
        }

        return callback(null, plugin, values);
      }
    },
    function(plugin, values, callback){
      // Update rrd with series
      rrdtool.update(plugin.rrdFile, new Date(), values, [], function(err, output) {
        callback(null, plugin);
      });
    }
  ], function (err, plugin) {
    if (err) {
      throw err;
    }

    cb(err, plugin);
  });
};

/**
 * Loop a single plugin based on options.interval
 * @param  {[type]} plugin
 */
Metriks.prototype._runPlugin = function(self, plugin, cb) {
  self.cli.info(util.format(
    'Running plugin %s at interval %s to %s',
    plugin.name,
    plugin.interval,
    plugin.rrdFile
  ));

  var tasks = [];
  // Always write rrds
  tasks.push(function (callback) {
    self._writeRRD(plugin, function (err, output) {
      callback(err, plugin);
    });
  });

  // Optionally write pngs
  if (self.autoWritePng) {
    tasks.push(function (plugin, callback) {
      self._writePNG(plugin, function (err, output) {
        callback(err, output);
      });
    });
  }

  async.waterfall(tasks, function (err, output) {
    if (err) {
      return self.cli.error(util.format('failure %s.', err));
    }
    self.cli.info(util.format('%s task(s) for plugin %s complete', tasks.length, plugin.name));
    cb(null);
  });

  // Reschedule
  self._timers.push(setTimeout(function () {
    self._q.push(plugin);
  }, plugin.interval * 1000));
};

Metriks.prototype._loadPlugin = function(pluginFile, cb) {
  // Parse options from source's comments
  var self         = this;
  var plugin      = {};
  plugin.graph      = {};

  self.cli.info(util.format('Loading plugin %s', pluginFile));

  var opts = {
    encoding: 'utf8',
    timeout: 10 * 1000,
    maxBuffer: 200 * 1024,
    killSignal: 'SIGTERM',
    cwd: path.dirname(plugin.pluginFile),
    env: process.ENV
  };
  exec(pluginFile, opts, function (err, stdout, stderr) {
    if (err) {
      return cb('Cannot execute plugin. If you want to disable rather set enable: false. ' + stderr);
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


    // var config = nested.config || {};
    // var graph = nested.graph || {};

    config = _.defaults(nested.config || {}, self.defaultConfigOptions);
    graph  = _.defaults(nested.graph || {}, self.defaultGraphOptions);

    _.extend(plugin, config);
    _.extend(plugin.graph, graph);

    // Fixed plugin options
    plugin.name       = path.basename(pluginFile, '.sh');
    plugin.pluginFile = pluginFile;
    plugin.executable = !!(1 & parseInt ((fs.statSync(pluginFile).mode & parseInt('777', 8)).toString(8)[0]));

    // Smart plugin options
    if (!plugin.rrdFile) {
      plugin.rrdFile = util.format('%s/%s-%s.rrd', plugin.name, os.hostname(), plugin.name);
    }
    if (plugin.rrdFile.substr(0, 1) !== '/') {
      plugin.rrdFile = self.rrdDir + '/' + plugin.rrdFile;
    }

    if (!plugin.pngFile) {
      plugin.pngFile = util.format('%s/%s-%s.png', plugin.name, os.hostname(), plugin.name);
    }
    if (plugin.pngFile.substr(0, 1) !== '/') {
      plugin.pngFile = self.pngDir + '/' + plugin.pngFile;
    }

    if (plugin.enabled === 'false') {
      plugin.enabled = false;
    } else {
      plugin.enabled = true;
    }

    plugin.interval = plugin.interval * 1;

    // console.log(plugin);

    return cb(null, plugin);
  });
};

/**
 * Load plugin configuration from disk
 * @param  {Function} cb
 * @return {[type]}
 */
Metriks.prototype._loadAllPlugins = function (cb) {
  var self    = this;
  var plugins = [];

  if (!fs.existsSync(self.pluginDir)) {
    return cb(util.format('Plugin directory %s does not exist', self.pluginDir));
  }

  glob(self.pluginDir + '/*', {}, function (err, files) {
    if (err) {
      return cb(err);
    }

    files.forEach(function (pluginFile) {
      self._loadPlugin(pluginFile, function(err, plugin) {
        if (err) {
          return cb(err);
        }

        plugins.push(plugin);

        if (plugins.length === files.length) {
          cb(null, plugins);
        }
      });
    });
  });
};

