exports         = module.exports = Metriks;
exports.Metriks = Metriks;

function Metriks(config) {
  this.config        = config;
  this.pluginManager = new PluginManager(this.config);
}

var PluginManager = require('./src/plugin-manager').PluginManager;
var WebServer     = require('./src/web-server').WebServer;


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
