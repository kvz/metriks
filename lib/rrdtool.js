var _         = require('underscore');
var sys       = require('sys');
var fs        = require('fs');
var exec      = require('child_process').exec;
var unflatten = require('flat').unflatten;
var util      = require('util');

exports.RRDTool = RRDTool;

function RRDTool(config) {
  this.cli = {
    info:  function(str) {console.log('INFO:  ' + str); },
    debug: function(str) {console.log('DEBUG: ' + str); },
    error: function(str) {console.log('ERROR: ' + str); },
    fatal: function(str) {console.log('FATAL: ' + str); },
    ok:    function(str) {console.log('OK:    ' + str); },
  };

  _.extend(this, config);
}


RRDTool.prototype.escape = function(args) {
  return Array.prototype
    .slice.call(args)
    .map(function(argument) {
      if (argument === undefined || argument === null) {
        argument = '';
      }

      if (argument === '') {
        return "''";
      }

      // Escape everything that is potentially unsafe with a backslash
      // return (argument+'').trim().replace(/([^0-9a-zA-Z-])/g, '\\$1');
      // rrdtool requires different escaping
      return (argument+'').trim().replace(/([^0-9a-zA-Z-\\\"\_\.\/\:])/g, '\\$1');
    })
    .join(' ');
};


RRDTool.prototype.exe = function(cmd, options, cb) {
  var self = this;
  var args = [];

  args.push(cmd);
  options.forEach(function (val, key) {
    if (_.isObject(val)) {
      _.each(val, function(subVal, subKey) {
        if (subVal === false || subVal === 'false') {
          return;
        }
        if (subKey.length === 1) {
          args.push('-' + subKey);
        } else {
          args.push('--' + subKey.replace(/([A-Z])/g, '-$1').toLowerCase());
        }

        if (subVal === true || subVal === 'true') {
          return;
        }

        args.push(subVal + '');
      });

      return;
    }

    args.push(val + '');
  });

  var fullCmd = 'rrdtool ' + self.escape(args);
  self.cli.debug(fullCmd);

  var opts = {
    encoding: 'utf8',
    timeout: 50 * 1000,
    maxBuffer: 200 * 1024,
    killSignal: 'SIGTERM',
  };

  exec(fullCmd, opts, function (err, stdout, stderr) {
    if (err !== null || stderr) {
      return cb(new Error(util.format(
        'Error while executing %s. %s. stderr: %s',
        fullCmd,
        err,
        stderr
      )));
    }

    return cb(null, stdout);
  });
};

/**
 * Different from _.defaults because this goes over the option
 * Array to apply missing Object properties
 * @param  {[type]} options     [description]
 * @param  {[type]} defaultOpts [description]
 * @return {[type]}             [description]
 */
RRDTool.prototype._default = function(options, defaultOpts) {
  var defaultKeys = _.keys(defaultOpts);
  var hasKeys     = [];

  _.each(defaultOpts, function(defaultVal, defaultKey) {
    var found = false;

    options.forEach(function (val, key) {
      if (_.isObject(val)) {
        _.each(val, function(subVal, subKey) {
          if (subKey === defaultKey) {
            found = true;
            return;
          }
        });
      }
    });

    if (!found) {
      options[defaultKey] = defaultVal;
    }
  });

  return options;
};

RRDTool.prototype.create = function(rrdFile, options, cb) {
  var self = this;
  options  = options || [];
  options.unshift(rrdFile);

  options = self._default(options, {
    start: new Date(),
    step: 300
  });

  self.exe('create', options, cb);
};

RRDTool.prototype.update = function(rrdFile, time, values, options, cb) {
  var self = this;
  options  = options || [];
  options.unshift(rrdFile);
  options.push(self.rrdTime(time) + ':' + values.join(':'));
  self.exe('update', options, cb);
};

RRDTool.prototype.graph = function (pngFile, options, cb) {
  var self = this;
  options  = options || [];
  options.unshift(pngFile);
  self.exe('graph', options, cb);
};

RRDTool.prototype.info = function (rrdFile, options, cb) {
  var self = this;
  options  = options || [];
  options.unshift(rrdFile);

  if (!fs.existsSync(rrdFile)) {
    // rrd file doesn not exist (yet)
    self.cli.debug('rrd file doesn not exist (yet) ' + rrdFile);
    return cb(null, null);
  }

  self.exe('info', options, function (err, stdout) {
    if (err) {
      return cb(err);
    }

    var info = self.explodeTree(stdout);
    if (!('ds' in info)) {
      self.cli.debug({rrdFile: rrdFile, info: info, stdout: stdout});
      return cb(new Error(util.format(
        'No ds found in info for %s',
        rrdFile
      )));
    }

    return cb(null, info);
  });
};

RRDTool.prototype.explodeTree = function(buf) {
  var self = this;
  var flat = {};
  buf.split('\n').forEach(function (line) {
    var parts  = line.split(' = ');
    var rawKey = parts.shift();
    var rawVal = parts.join(' = ');

    var key = rawKey
      .replace(/[\.\[\]]+/g, '.')
      .replace(/^\[/, '')
      .replace(/\]$/, '');

    flat[key] = self.toVal(rawVal);
  });

  return unflatten(flat);
};

RRDTool.prototype.toVal = function(val) {
  var self = this;

  if (self.isNumeric(val)) {
    val = val * 1;
  } else {
    val = (val + '').trim();
    if (val.substr(0, 1) === '"' && val.substr(-1) === '"') {
      val = val.replace(/(^"|"$)/g, '');
    }
  }

  return val;
};

/**
 * isNumeric is something else than isNumber. We also allow strings posing as numbers.
 * @param  {[type]}  n [description]
 * @return {Boolean}   [description]
 */
RRDTool.prototype.isNumeric = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

RRDTool.prototype.rrdTime = function (date) {
  return Math.round(date.valueOf() / 1000);
};

RRDTool.prototype.toLineTitle = function (str) {
  str = (str + '').replace(/[^a-zA-Z0-9_ \.\/]/g, '');
  str = (str).replace(/\s+/g, ' ');
  return str;
};

RRDTool.prototype.toDSTitle = function (str) {
  // An rrd ds name can only be 19 chars long
  str = (str + '').replace(/[^a-zA-Z0-9_ ]/g, '');
  str = (str).replace(/\s+/g, ' ');
  return str.substr(0, 19);
};

RRDTool.prototype.toDatasourceName = function (str) {
  // An rrd ds name can only be 19 chars long
  str = (str + '').replace(/[^a-zA-Z0-9_]/g, '_');
  return str.substr(0, 19);
};
