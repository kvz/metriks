var assert = require('assert');
var cli    = require('cli');
var os     = require('os');
var Plugin = require('../lib/plugin').Plugin;
var plugin = new Plugin({
  pluginFile  : __dirname + '/plugins/count.sh',
  rrdDir      : __dirname + '/rrd',
  pngDir      : __dirname + '/png',
  autoWritePng: true,
  cli         : {
    info:  function(str) {console.log('INFO:  ' + str); },
    debug: function(str) {console.log('DEBUG: ' + str); },
    error: function(str) {console.log('ERROR: ' + str); },
    fatal: function(str) {console.log('FATAL: ' + str); },
    ok:    function(str) {console.log('OK:    ' + str); },
  }
});

describe('plugin', function(){
  describe('parseSeries', function(){
    it('single value should return plugin name as key', function(done){
      plugin.reload(function (err) {
        plugin.parseSeries('1', '', function (err, series) {
          assert.deepEqual(series, [{"value":1,"key":"count"}]);
          done();
        });
      });
    });
  });
});

describe('plugin', function(){
  describe('reload', function(){
    it('should set all plugin properties for count.sh', function(done){
      plugin.reload(function (err) {
        assert.strictEqual(err, null);
        assert.strictEqual(plugin.name, 'count');
        assert.strictEqual(plugin.timeout, 50);
        assert.strictEqual(plugin.autoWritePng, true);
        assert.strictEqual(plugin.enabled, true);
        assert.strictEqual(plugin.executable, true);

        assert.deepEqual(plugin.graph, {
          start: 'end-5s',
          step: '1',
          lines: {
            "1": {"color":"#FFFFFFFF","title":"One"},
            "2": {"color":"#000000FF","title":"Two"},
            "8_8_8_8": {"color":"#FF0000FF","title": "IP 8.8.8.8"},
          },
          width: 1000,
          height: 600,
          watermark: 'kvz.io',
          font: 'DEFAULT:10:Inconsolata',
          tabwidth: 20,
          border: 2,
          zoom: 1,
          fullSizeMode: true,
          dynamicLabels: true,
          slopeMode: true,
          end: 'now',
          verticalLabel: ''
        });
        done();
      });
    });
  });
});
