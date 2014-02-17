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
    debug: function(str){console.log(str);},
    error: function(str){console.log(str);},
    info : function(str){console.log(str);},
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
          lineTitles:
           [ 'One',
             'Two' ],
          lineColors:
           [ '#FFFFFFFF',
             '#E992ECFF',
             '#FF0051FF',
             '#9AEBEAFF',
             '#D73A3FFF',
             '#44B824FF',
             '#6384B3FF',
             '#2F4D5DFF',
             '#E1E3EAFF',
             '#7F9B8BFF',
             '#FDFFA8FF',
             '#C7D5AEFF',
             '#8E7F57FF',
             '#FBFFF2FF',
             '#CF492CFF',
             '#9863B6FF',
             '#EF8E1CFF',
             '#45B175FF',
             '#3A96D0FF' ],
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
