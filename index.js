exports         = module.exports = Metriks;
exports.Metriks = Metriks;

function Metriks(config) {
  this.config        = config;
  this.pluginManager = new PluginManager(this.config);
}

var PluginManager = require('./lib/plugin-manager').PluginManager;
var WebServer     = require('./lib/web-server').WebServer;


Metriks.prototype.start = function() {
};

Metriks.prototype.start = function() {
  
  if (this.config.graph) {
    this.pluginManager.graph(program.graph);
  } else {
    this.pluginManager.start();
  }

  if (this.config.webPort > 0) {
    var webServer = new WebServer(this.config);
    webServer.start();
  }
};
