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
 - Builds on `nodejs` for optimal concurrency and the ability to run a server without dealing with cgi-bin, etc.
 - Minimal dependencies. If you have node.js/npm working, all you need is `aptitude install rrdtool` and you're ready to go
 - Writes RRDs & images to disk, so it works when everything else is down.
 - Idempotent. Metriks will create graphs that don't exist, and generally be eager to get you results.
 - Trivial to add graphs. It should Just Work by default. Write a plugin file in any language. If it output a number, metriks will graph it for you. You can optionally output configuration strings like `# config.interval: 60` or `# graph.title: Load average` to finetune behavior. Newlines (`\n`) separate graph lines. Other whitespaces separate graph label from value. See the [load plugin](https://github.com/kvz/metriks/blob/master/plugins/load.sh) for an example how to plot 3 load lines: 1 minute, 5 minute, 15 minute averages. 
 - Can send out alerts when metric go outside boundaries

Metriks is very basic. If you want advanced, there are plenty of options out there like graphite, mrtg or (paid) librato.
Metriks however will never:

 - Require you to know perl / cgi-bin / xml / apache / etc
 - Get in your way
 - Ask you for money

## Todo

 - [ ] More advanced rrd types (COUNTER vs GAUGE, ability to add a custom step, AREA graphs) as req in [#1](https://github.com/kvz/metriks/issues/1)
 - [ ] Offer an API that so that you can programatically add values in Nodejs programs. e.g. `require('metriks').graph('df').addSeries([{'/': '50%'}])`
 - [ ] Checkout smokeping sources and try to build a plugin very similar to it. This should expose some limitations and make it more usable in different environments after fixing those.
 - [ ] Something that can generate an index page/json of rrd/images
 - [ ] Upload to s3 as a step after rrd -> graph -> upload
 - [ ] Aggregate datasources into 1 graph using glob
 - [ ] Support for max & min values and a way to communicate problems to the outside world
 - [ ] Dynamically expand ds using rrdtool dump / import. It's hard, see http://stackoverflow.com/questions/13476226/adding-new-datasource-to-an-existing-rrd
 - [ ] More unit test coverage
 - [ ] Add example section to readme with screenshots and plugin code
 - [x] Offer an optional webserver via e.g. [send](https://github.com/visionmedia/send) so you can browse through the generated pngs
 - [x] _.findWhere
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

## Prerequisites

I'm assuming you already have node/npm and git installed.

### OSX

To run rrdtool on OSX you'll need [XQuartz](http://xquartz.macosforge.org). Then via brew:

```bash
brew install rrdtool coreutils
```

### Ubuntu

```bash
aptitude install rrdtool
```

## Install

```bash
git clone https://github.com/kvz/metriks.git
cd metriks
npm install
```

## Run

```bash
./bin/metriks --debug
```

## Test

```bash
make test
```

## License

[MIT LICENSE](LICENSE)

