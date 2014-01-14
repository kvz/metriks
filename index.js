#!/usr/bin/env node
var program = require('commander');
var metrik  = require('./lib/metrik');

var workDir = (process.env.HOME || '/tmp') + '/metrik';

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

var metrik = new metrik.Metrik(config);

if (program.graph) {
  metrik.graph(program.graph);
} else {
  metrik.start();
}
