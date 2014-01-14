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
 - [ ] Make test: step 1, imagick compare
 - [ ] Dynamically expand ds using export
 - [ ] Checkout smokeping sources
 - [ ] commander -> cli
 - [ ] test cases
 - [ ] save to s3
 - [ ] aggregate
 - [ ] max & min values
 - [ ] different rrd types
 - [x] Explodetree/flatten, use it for plug-in config (linecolour slice to array) and rrdtool info
 - [x] _.isNumeric
 - [x] librato colors
 - [x] graph options need to be interpretted
 - [x] configurable y-axis
 - [x] Lose rrd.js over rrdtool.js
 - [x] async.parallel jobs
 - [x] support for .go plugins


## Test

```bash
make test
```

## License

[MIT LICENSE](LICENSE)

