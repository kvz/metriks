# Features

 - Builds on RRD. The network industry standard of saving time-series data to disk with a constant storage footprint
 - Utilizes nodejs' async for optimal concurrency
 - Minimal dependencies and writes RRDs & images to disk, so it works when everything else is down.
 - Minimal effort to add new graphs
 - Thresholds pagers

# Todo

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

# Reset

```bash
rm -rf /srv/shared/rrds/*
```

# Poll

```bash
node index.js  --rrd-dir /srv/shared/rrds/  --png-dir /srv/shared/p/stats  --auto-write-png
```

# 1 Graph

```bash
rm /srv/current/*.png \
&& node index.js \
 --rrd-dir /srv/shared/rrds \
 --png-dir /srv/shared/tmp/stats \
 --graph df \
```

# See

On vagrant

```bash
rm /srv/current/*.png; cp -f /srv/shared/tmp/stats/*/*.png /srv/current/
```

On osx

```bash
open *.png
```

