## Features

 - Builds on `rrdtool`. The network industry standard of saving time-series data to disk with a constant storage footprint.
 - Build on `nodejs` for optimal concurrency and the ability to run a server without dealing with cgi-bin, etc.
 - Minimal dependencies. If you have node.js/npm working, all you need is `aptitude install rrdtool` and you're ready to go
 - Writes RRDs & images to disk, so it works when everything else is down.
 - Minimal effort to add new graphs. Works by default.
 - Can send out alerts when metric go outside boundaries

## Todo

 - [ ] Refactor: Plugin, pluginmanager, graph, rrd, rrdtool, cli
 - [ ] _.template
 - [ ] _.findWhere
 - [ ] Checkout smokeping sources and try to build a plugin very similar to it
 - [ ] Move from commander npm to cli
 - [ ] Something that can generate an index page/json of rrd/images
 - [ ] Upload to s3 as a step after rrd -> graph -> upload
 - [ ] Aggregate datasources into 1 graph using glob
 - [ ] Support for max & min values and a way to communicate problems to the outside world
 - [ ] Support for different rrd types
 - [ ] More unit test coverage
 - [ ] Visually show / compare integration test
 - [ ] Dynamically expand ds using rrdtool dump / import. It's hard, see http://stackoverflow.com/questions/13476226/adding-new-datasource-to-an-existing-rrd
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

### OSX

http://xquartz.macosforge.org

```bash
brew install rrdtool
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

