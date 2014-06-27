var coffee  = require('coffee-script/register');
var assert  = require('assert');
var RRDTool = require('../lib/rrdtool').RRDTool;
var rrdtool = new RRDTool();

var rrdFilePing        = __dirname + '/ping.rrd';
var rrdFileTemp        = __dirname + '/temp.rrd';
var rrdFileNonexisting = __dirname + '/nonexisting.rrd';
var rrdtoolInfoOutput  = 'filename = "/Users/kevin/metriks/rrd/nslookup/kvz-imac-home-4.local-nslookup.rrd"\nrrd_version = "0003"\nstep = 300\nlast_update = 1392592863\nheader_size = 1832\nds[8_8_8_8].index = 0\nds[8_8_8_8].type = "GAUGE"\nds[8_8_8_8].minimal_heartbeat = 600\nds[8_8_8_8].min = NaN\nds[8_8_8_8].max = NaN\nds[8_8_8_8].last_ds = "19"\nds[8_8_8_8].value = 2.0900000000e+02\nds[8_8_8_8].unknown_sec = 52\nds[8_8_4_4].index = 1\nds[8_8_4_4].type = "GAUGE"\nds[8_8_4_4].minimal_heartbeat = 600\nds[8_8_4_4].min = NaN\nds[8_8_4_4].max = NaN\nds[8_8_4_4].last_ds = "20"\nds[8_8_4_4].value = 2.2000000000e+02\nds[8_8_4_4].unknown_sec = 52\nds[4_2_2_2].index = 2\nds[4_2_2_2].type = "GAUGE"\nds[4_2_2_2].minimal_heartbeat = 600\nds[4_2_2_2].min = NaN\nds[4_2_2_2].max = NaN\nds[4_2_2_2].last_ds = "122"\nds[4_2_2_2].value = 1.3420000000e+03\nds[4_2_2_2].unknown_sec = 52\nds[208_67_222_222].index = 3\nds[208_67_222_222].type = "GAUGE"\nds[208_67_222_222].minimal_heartbeat = 600\nds[208_67_222_222].min = NaN\nds[208_67_222_222].max = NaN\nds[208_67_222_222].last_ds = "18"\nds[208_67_222_222].value = 1.9800000000e+02\nds[208_67_222_222].unknown_sec = 52\nds[172_16_0_23].index = 4\nds[172_16_0_23].type = "GAUGE"\nds[172_16_0_23].minimal_heartbeat = 600\nds[172_16_0_23].min = NaN\nds[172_16_0_23].max = NaN\nds[172_16_0_23].last_ds = "-1"\nds[172_16_0_23].value = -1.1000000000e+01\nds[172_16_0_23].unknown_sec = 52\nrra[0].cf = "AVERAGE"\nrra[0].rows = 300\nrra[0].cur_row = 215\nrra[0].pdp_per_row = 1\nrra[0].xff = 5.0000000000e-01\nrra[0].cdp_prep[0].value = NaN\nrra[0].cdp_prep[0].unknown_datapoints = 0\nrra[0].cdp_prep[1].value = NaN\nrra[0].cdp_prep[1].unknown_datapoints = 0\nrra[0].cdp_prep[2].value = NaN\nrra[0].cdp_prep[2].unknown_datapoints = 0\nrra[0].cdp_prep[3].value = NaN\nrra[0].cdp_prep[3].unknown_datapoints = 0\nrra[0].cdp_prep[4].value = NaN\nrra[0].cdp_prep[4].unknown_datapoints = 0\n';

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
  describe('explodeTree', function(){
    it('should return exploded Tree', function(done){
      var info = rrdtool.explodeTree(rrdtoolInfoOutput);
      assert.strictEqual(info.ds['8_8_8_8'].last_ds, "19");
      done();
    });
  });
});
