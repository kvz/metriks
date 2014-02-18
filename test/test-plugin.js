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
    it('single value should return plugin name as dsName', function(done){
      plugin.reload(function (err) {
        plugin.parseSeries('1', '', function (err, series) {
          assert.deepEqual(series, [{"value":1,"dsName":"count"}]);
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

        assert.deepEqual(plugin.line, {
          '1': { color: '#FFFFFFFF', title: 'One' },
          '2': { color: '#000000FF', title: 'Two' },
          '8_8_8_8': { color: '#FF0000FF', title: 'IP 8.8.8.8' }
        });
        assert.deepEqual(plugin.lineStore, {
          '8_8_8_8': {
            heartBeat: '599',
          }
        });
        assert.deepEqual(plugin.graphStore, {
          consolidation: 'AVERAGE',
          xff: 0.5,
          step: '2',
          rows: 300
        });
        assert.deepEqual(plugin.graph, {
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
          start: 'end-5s',
          verticalLabel: '',
          step: '1'
        });
        done();
      });
    });
  });
});

describe('plugin', function(){
  describe('getLineStore', function(){
    it('should enrich lineStore on runtime', function(done){
      plugin.reload(function (err) {
        var lineStore = plugin.getLineStore('8.8.8.8');
        delete lineStore.rrdFile;
        assert.deepEqual(lineStore, {
         dsType: 'COUNTER',
          consolidation: 'AVERAGE',
          heartBeat: '599',
          min: 'U',
          max: 'U',
          vName: '8_8_8_8a',
          dsName: '8_8_8_8'
        });
        done();
      });
    });
  });
});
