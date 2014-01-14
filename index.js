#!/usr/bin/env node
var program = require('commander');
var metriks  = require('./lib/metriks');

var workDir = (process.env.HOME || '/tmp') + '/metriks';

program
  .version('0.0.1')
  .option('-c, --concurrency [num]', 'How many plugins to run at once', 5)
  .option('-a, --auto-write-png', 'Automatically write png files to png-dir')
  .option('-g, --graph [plugin name or rrd file]')
  .option('-p, --plugin-dir [dir]', 'Plugin directory. Overrules workDir. ', __dirname + '/plugins')
  .option('-r, --rrd-dir [dir]', 'RRD directory. Overrules workDir. ', workDir + '/rrds')
  .option('-i, --png-dir [dir]', 'Image / HTML directory. Overrules workDir. ', workDir + '/png')
  .parse(process.argv);

var config = {
  pluginDir   : program.pluginDir,
  rrdDir      : program.rrdDir,
  pngDir      : program.pngDir,
  autoWritePng: program.autoWritePng
};

var metriks = new metriks.Metriks(config);

if (program.graph) {
  metriks.graph(program.graph);
} else {
  metriks.start();
}
