var assert        = require('assert');
var cli           = require('cli'   );
var PluginManager = require('../lib/plugin-manager').PluginManager;
var pluginManager = new PluginManager({
  pluginDir: __dirname + '/plugins',
  cli      : {
    debug: function(str){console.log(str);},
    error: function(str){console.log(str);},
    info : function(str){console.log(str);},
  }
});

describe('pluginManager', function(){
  describe('find', function(){
    it('should find the "one" plugin from the test dir', function(done){
      pluginManager.find('one', function (err, plugin){
        assert.strictEqual(plugin.name, 'one');
        done();
      });
    });
  });
});
