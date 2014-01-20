# Metriks

<!-- badges/ -->
[![Build Status](https://secure.travis-ci.org/kvz/metriks.png?branch=master)](http://travis-ci.org/kvz/metriks "Check this project's build status on TravisCI")
[![NPM version](http://badge.fury.io/js/metriks.png)](https://npmjs.org/package/metriks "View this project on NPM")
[![Dependency Status](https://david-dm.org/kvz/metriks.png?theme=shields.io)](https://david-dm.org/kvz/metriks)
[![Development Dependency Status](https://david-dm.org/kvz/metriks/dev-status.png?theme=shields.io)](https://david-dm.org/kvz/metriks#info=devDependencies)

[![Gittip donate button](http://img.shields.io/gittip/kvz.png)](https://www.gittip.com/kvz/ "Sponsor the development of metriks via Gittip")
[![Flattr donate button](http://img.shields.io/flattr/donate.png?color=yellow)](https://flattr.com/submit/auto?user_id=kvz&url=https://github.com/kvz/metriks&title=metriks&language=&tags=github&category=software "Sponsor the development of metriks via Flattr")
[![PayPayl donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=kevin%40vanzonneveld%2enet&lc=NL&item_name=Open%20source%20donation%20to%20Kevin%20van%20Zonneveld&currency_code=USD&bn=PP-DonationsBF%3abtn_donate_SM%2egif%3aNonHosted "Sponsor the development of metriks via Paypal")
[![BitCoin donate button](http://img.shields.io/bitcoin/donate.png?color=yellow)](https://coinbase.com/checkouts/19BtCjLCboRgTAXiaEvnvkdoRyjd843Dg2 "Sponsor the development of metriks via BitCoin")
<!-- /badges -->

## Features

 - Builds on `rrdtool`. The network industry standard of saving time-series data to disk with a constant storage footprint.
 - Build on `nodejs` for optimal concurrency and the ability to run a server without dealing with cgi-bin, etc.
 - Minimal dependencies. If you have node.js/npm working, all you need is `aptitude install rrdtool` and you're ready to go
 - Writes RRDs & images to disk, so it works when everything else is down.
 - Minimal effort to add new graphs. Works by default.
 - Can send out alerts when metric go outside boundaries

## Todo

 - [ ] _.findWhere
 - [ ] Checkout smokeping sources and try to build a plugin very similar to it
 - [ ] Something that can generate an index page/json of rrd/images
 - [ ] Upload to s3 as a step after rrd -> graph -> upload
 - [ ] Aggregate datasources into 1 graph using glob
 - [ ] Support for max & min values and a way to communicate problems to the outside world
 - [ ] Support for different rrd types
 - [ ] More unit test coverage
 - [ ] Dynamically expand ds using rrdtool dump / import. It's hard, see http://stackoverflow.com/questions/13476226/adding-new-datasource-to-an-existing-rrd
 - [x] Refactoring: Plugin
 - [x] Refactoring: pluginmanager
 - [x] Refactoring: rrdtool
 - [x] Refactoring: cli
 - [x] Retire thong.tmpl for _.template
 - [x] Retire thong.sprintf for util.format
 - [x] Retire commander for cli
 - [x] Visually show integration test
 - [x] One integration test
 - [x] Test cases
 - [x] Explodetree/flatten, use it for plug-in config (linecolour slice to array) and rrdtool info
 - [x] _.isNumeric
 - [x] Librato colors
 - [x] Graph options need to be interpretted
 - [x] Configurable y-axis
 - [x] Lose rrd.js over rrdtool.js
 - [x] Async.parallel jobs
 - [x] Support for .go plugins

### OSX

http://xquartz.macosforge.org

```bash
brew install rrdtool coreutils
```

### Ubuntu

```bash
aptitude install rrdtool
```

## Test

```bash
make test
```

## License

[MIT LICENSE](LICENSE)

