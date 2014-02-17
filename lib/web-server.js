var _       = require('underscore');
var connect = require('connect');

exports           = module.exports = new WebServer();
exports.WebServer = WebServer;

function WebServer(config) {
  this.webPort = 8000;
  this.pngDir  = '';
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
    console.log('\033[90mserving \033[36m%s\033[90m on port \033[96m%d\033[0m', self.pngDir, self.webPort);
  });  
};
