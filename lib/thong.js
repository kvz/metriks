var _         = require('underscore');
var sys       = require('sys');
exports.Thong = Thong;

function Thong(config) {
  _.extend(this, config);
}

Thong.prototype.slug = function(s) {
  s = (s + '').replace(/ /g, '-');
  s = s.replace(/[^A-Za-z0-9-_\.]/g, '_');
  return s;
};

Thong.prototype.out = function (str) {
  console.log(str);
};

Thong.prototype.debug = function () {
  this.out('debug : ' + this.sprintf.apply(this.sprintf, Array.prototype.slice.call(arguments)));
};

Thong.prototype.info = function () {
  this.out('info  : ' + this.sprintf.apply(this.sprintf, Array.prototype.slice.call(arguments)));
};
Thong.prototype.error = function () {
  this.out('error : ' + this.sprintf.apply(this.sprintf, Array.prototype.slice.call(arguments)));
};

Thong.prototype.templ = function(str, params) {
  return (str + '').replace(/\{([a-z0-9_]+)\}/gi, function (m, c, i, s) {
    if (c in params) {
      return params[c];
    }
    return c;
  });
};

Thong.prototype.sprintf = function() {
  var args = Array.prototype.slice.call(arguments);
  var str  = args.shift();

  return (str + '').replace(/%[so]/g, function(m, i, s) {
    var arg = args.shift();
    if (m == '%o') {
      return sys.inspect(arg);
    }

    if (!arg && arg !== 0) {
      return '';
    }

    return (arg + '');
  });
};
