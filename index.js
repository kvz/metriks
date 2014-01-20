#!/usr/bin/env node
var cli     = require('cli').enable('status', 'help', 'version', 'glob', 'timeout');
var metriks = require('./lib/metriks');
var _       = require('underscore');
var workDir = (process.env.HOME || '/tmp') + '/metriks';

// --debug works out of the box. See -h
cli.parse({
  concurrency:      ['c', 'How many plugins to run at once', 'number', 5],
  "auto-write-png": ['a', 'Automatically write png files to png-dir', 'boolean', false],
  name:             ['n', 'Name of plugin or rrd file]', 'string' ],
  "plugin-dir":     ['p', 'Plugin directory. Overrules workDir. ', 'path', __dirname + '/plugins' ],
  "rrd-dir":        ['r', 'RRD directory. Overrules workDir. ', 'path', workDir + '/rrds' ],
  "png-dir":        ['i', 'Image / HTML directory. Overrules workDir. ', 'path', workDir + '/png' ]
});

cli.main(function(args, options) {
  var self   = this;
  var config = {};
  _.each(options, function(val, key) {
    var camelCased = key.replace(/-(.)/g, function (g) {
      return g[1].toUpperCase();
    });

    config[camelCased] = val;
  });

  config.cli = self;

  var Metriks = new metriks.Metriks(config);

  if (options.graph) {
    Metriks.graph(program.graph);
  } else {
    Metriks.start();
  }
});

