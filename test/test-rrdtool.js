var assert  = require('assert');
var RRDTool = require('../lib/rrdtool').RRDTool;
var rrdtool = new RRDTool();

var rrdFilePing        = __dirname + '/ping.rrd';
var rrdFileTemp        = __dirname + '/temp.rrd';
var rrdFileNonexisting = __dirname + '/nonexisting.rrd';

describe('rrdtool', function(){
  describe('info', function(){
    it('should contain ds for the ping rrd', function(done){
      rrdtool.info(rrdFileTemp, [], function(err, info) {
        assert.ok('ds' in info);
        assert.ok('ping' in info.ds);
        assert.strictEqual(info.ds.ping.last_ds, '105.75');
        assert.strictEqual(info.rra[0].cf, 'AVERAGE');
        assert.strictEqual(info.rra[0].cdp_prep['0'].value, 'NaN');
        done();
      });
    });
    it('should return null if rrd does not exist', function(done){
      rrdtool.info(rrdFileNonexisting, [], function(err, info) {
        assert.strictEqual(info, null);
        done();
      });
    });
  });
  describe('update', function(){
    it('should update with 1 value', function(done){
      rrdtool.update(rrdFileTemp, new Date(), [120], [], function(err, output) {
        assert.strictEqual(err, null);
        assert.strictEqual(output, '');

        done();
      });
    });
  });
});
