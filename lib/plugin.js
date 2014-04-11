var _         = require('underscore');
var async     = require('async');
var exec      = require('child_process').exec;
var fs        = require('fs');
var glob      = require('glob');
var os        = require('os');
var sys       = require('sys');
var util      = require('util');
var path      = require('path');
var RRD       = require('./rrd').RRD;
var unflatten = require('flat').unflatten;
var knox      = require('knox');

_.templateSettings = {
  interpolate: /\{(.+?)\}/g
};

exports.Plugin = Plugin;

function Plugin(config) {
  this.defaultConfig = {
    interval  : '60',
    enabled   : true,
    executable: true,
  };

  // mgr config
  this.pluginFile   = null;
  this.autoWritePng = null;
  this.autoUploadS3 = null;
  this.cli          = {
    info:  function(str) {console.log('INFO:  ' + str); },
    debug: function(str) {console.log('DEBUG: ' + str); },
    error: function(str) {console.log('ERROR: ' + str); },
    fatal: function(str) {console.log('FATAL: ' + str); },
    ok:    function(str) {console.log('OK:    ' + str); },
  };

  _.extend(this, config);
}

Plugin.prototype.reload = function(cb) {
  var self = this;

  // Parse options from source's comments
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
      return cb(new Error(util.format(
        'Cannot execute plugin %s. If you want to disable please set \'# config.enable: false\'. %s %s %s',
        self.pluginFile,
        stderr,
        err,
        stdout
      )));
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
      object   : true,
    });

    // Apply defaults to said config
    _.extend(self, self.defaultConfig, nested.config);

    // Fixed plugin options
    self.name       = path.basename(self.pluginFile, '.sh');
    self.executable = !!(1 & parseInt ((fs.statSync(self.pluginFile).mode & parseInt('777', 8)).toString(8)[0]));

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

    self.rrd = new RRD({
      rrdDir    : self.rrdDir,
      pngDir    : self.pngDir,
      cli       : self.cli,

      name      : self.name,
      graph     : nested.graph,
      graphStore: nested.graphStore,
      line      : nested.line,
      lineStore : nested.lineStore,
    });

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
    self._execute(function (err) {
      callback(err);
    });
  });

  // Optionally write pngs
  if (self.autoWritePng) {
    tasks.push(function (callback) {
      self.rrd.grapher(function (err) {
        callback(err);
      });
    });
  }

  // Optionally upload to s3
  if (self.autoUploadS3) {
    tasks.push(function (callback) {
      self._uploadS3(function (err) {
        callback(err);
      });
    });
  }

  async.waterfall(tasks, function (err) {
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
      value : self.rrd.rrdtool.toVal(value),
      dsName: self.rrd.rrdtool.toDatasourceName(dsName),
    });
  });

  // If there is 1 row and no column name, name the line after the graph.
  // e.g.: 'uptime'
  if (series.length === 1 && self.rrd.rrdtool.isNumeric(series[0].dsName)) {
    if (!self.name) {
      return cb(new Error(util.format(
        'Plugin has no name when it was needed to label simplistic series'
      )));
    }
    series[0].dsName = self.rrd.rrdtool.toDatasourceName(self.name);
  } else {
    // console.log(series);
  }

  cb(null, series);
};

Plugin.prototype._execute = function(cb) {
  var self = this;

  async.waterfall([
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
          return callback(new Error(util.format(
            'Cannot execute %s. %s',
            self.pluginFile,
            stderr
          )));
        }
        if (stderr) {
          self.cli.error(util.format(
            'Saw stderr while running plugin: %s',
            stderr
          ));
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
      self.rrd.update(series, callback);
    }
  ], function (err) {
    cb(err);
  });
};

Plugin.prototype._uploadS3 = function (cb) {
  var self   = this;
  var config = {
    key   : 'METRIKS_S3_KEY',
    secret: 'METRIKS_S3_SECRET',
    bucket: 'METRIKS_S3_BUCKET',
  };

  _.each(config, function(env, key) {
    var v;
    if (!(v = process.env[env])) {
      return cb(new Error(util.format(
        'No ds found in info for %s',
        'Please set a %s environment var with the S3 %s ',
        env,
        key
      )));
    }
    config[key] = v;
  });

  var client          = knox.createClient(config);
  var files           = {};
  files[self.rrd.pngFile] = self.pngDir;
  files[self.rrd.rrdFile] = self.rrdDir;

  var uploaded = 0;
  var needed   = 0;
  _.each(files, function(dir, file) {
    if (fs.existsSync(file)) {
      needed++;

      var pat = new RegExp('^' + dir);
      var dst = file.replace(pat, '');

      var headers = {
        'x-amz-acl'    : 'public-read',
        'storage-class': 'STANDARD'
      };
      client.putFile(file, dst, headers, function(err, res){
        if (err || res.statusCode !== 200) {
          return cb(new Error(util.format(
            'Error while uploading %s. code: %s. %s',
            file,
            (res ? res.statusCode : ''),
            err
          )));
        }

        res.resume();
        if (++uploaded >= needed) {
          return cb(null);
        }
      });
    }
  });
};
