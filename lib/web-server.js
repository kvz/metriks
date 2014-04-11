var _       = require('underscore');
var connect = require('connect');
var util    = require('util');

exports.WebServer = WebServer;

function WebServer(config) {
  this.webPort = 8000;
  this.pngDir  = '';
  this.cli     = {
    info:  function(str) {console.log('INFO:  ' + str); },
    debug: function(str) {console.log('DEBUG: ' + str); },
    error: function(str) {console.log('ERROR: ' + str); },
    fatal: function(str) {console.log('FATAL: ' + str); },
    ok:    function(str) {console.log('OK:    ' + str); },
  };
  _.extend(this, config);
}

WebServer.prototype.start = function () {
  var self   = this;
  var server = connect();
  server.use(connect.static(self.pngDir, {
    hidden: false
  }));
  server.use(connect.directory(self.pngDir, {

  }));
  server.listen(self.webPort, function () {
    self.cli.info(util.format(
      'Serving %s on port %s',
      self.pngDir,
      self.webPort
    ));
  });
};
