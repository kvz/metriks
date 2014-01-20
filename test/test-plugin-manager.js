var assert        = require('assert');
var cli           = require('cli');
var os            = require('os');
var PluginManager = require('../lib/plugin-manager').PluginManager;
var pluginManager = new PluginManager({
  pluginDir: __dirname + '/plugins',
  rrdDir   : __dirname + '/rrd',
  cli      : {
    debug: function(str){console.log(str);},
    error: function(str){console.log(str);},
    info : function(str){console.log(str);},
  }
});

var rrdFile = __dirname + '/rrd/one/' + os.hostname() + '-one.rrd';


describe('pluginManager', function(){
  describe('find', function(){
    it('should find the "one" plugin by name', function(done){
      pluginManager.find('one', function (err, plugin){
        assert.strictEqual(err, null);
        assert.strictEqual(plugin.name, 'one');
        done();
      });
    });
    it('should find the "one" plugin by filepath', function(done){
      pluginManager.find(rrdFile, function (err, plugin){
        assert.strictEqual(err, null);
        assert.strictEqual(plugin.name, 'one');
        done();
      });
    });
  });
});
