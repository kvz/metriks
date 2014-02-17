var PluginManager = require('./lib/plugin-manager').PluginManager;
var WebServer     = require('./lib/web-server').WebServer;
var cli           = require('cli').enable('status', 'help', 'version', 'glob', 'timeout');
var workDir       = (process.env.HOME || '/tmp') + '/metriks';

cli.parse({
  "web-port":       [false, 'If > 0, run a webserver on that port to browse graphs', 'number', 0],
  "concurrency":    [false, 'How many plugins to run at once', 'number', 5],
  "auto-write-png": [false, 'Automatically write png files to png-dir', 'boolean', true],
  "name":           [false, 'Name of plugin or rrd file]', 'string' ],
  "plugin-dir":     [false, 'Plugin directory. Overrules workDir. ', 'path', __dirname + '/plugins' ],
  "rrd-dir":        [false, 'RRD directory. Overrules workDir. ', 'path', workDir + '/rrd' ],
  "png-dir":        [false, 'Image / HTML directory. Overrules workDir. ', 'path', workDir + '/png' ]
});

cli.main(function(args, options) {
  var self   = this;
  var config = {};

  for (var key in options) {
    var val = options[key];
    var camelCased = key.replace(/\-(.)/g, function (g) {
      return g[1].toUpperCase();
    });
    config[camelCased] = val;
  }

  config.cli = self;

  var pluginManager = new PluginManager(config);
  if (options.graph) {
    pluginManager.graph(program.graph);
  } else {
    pluginManager.start();
  }

  if (config.webPort > 0) {
    var webServer = new WebServer(config);
    webServer.start();
  }
});
