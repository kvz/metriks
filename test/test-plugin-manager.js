var coffee  = require('coffee-script/register');
var assert        = require('assert');
var cli           = require('cli');
var os            = require('os');
var PluginManager = require('../src/plugin-manager').PluginManager;
var pluginManager = new PluginManager({
  pluginDir: __dirname + '/plugins',
  rrdDir   : __dirname + '/rrd',
  pngDir   : __dirname + '/png',
  cli      : {
    debug: function(str){console.log(str);},
    error: function(str){console.log(str);},
    info : function(str){console.log(str);},
  }
});

var rrdFile = __dirname + '/rrd/count/' + os.hostname() + '-count.rrd';


describe('pluginManager', function(){
  describe('find', function(){
    it('should find the "count" plugin by name', function(done){
      pluginManager.find('count', function (err, plugin){
        assert.strictEqual(err, null);
        assert.strictEqual(plugin.name, 'count');
        done();
      });
    });
    it('should find the "count" plugin by filepath', function(done){
      pluginManager.find(rrdFile, function (err, plugin){
        assert.strictEqual(err, null);
        assert.strictEqual(plugin.name, 'count');
        done();
      });
    });
  });
});
