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

 - [ ] Checkout smokeping sources and try to build a plugin very similar to it
 - [ ] Something that can generate an index page/json of rrd/images
 - [ ] Upload to s3 as a step after rrd -> graph -> upload
 - [ ] Aggregate datasources into 1 graph using glob
 - [ ] Support for max & min values and a way to communicate problems to the outside world
 - [ ] Support for different rrd types
 - [ ] Dynamically expand ds using rrdtool dump / import. It's hard, see http://stackoverflow.com/questions/13476226/adding-new-datasource-to-an-existing-rrd
 - [ ] More unit test coverage
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





/usr/bin/rrdtool graph - \
"--start" \
"-10800" \
"--end" \
"now" \
"--height" \
"200" \
"--width" \
"600" \
"--title" \
"Latency Graph" \
"--rigid" \
"--lower-limit" \
"0" \
"--vertical-label" \
"Seconds" \
"--imgformat" \
"PNG" \
"--color" \
"SHADEA#ffffff" \
"--color" \
"SHADEB#ffffff" \
"--color" \
"BACK#ffffff" \
"--color" \
"CANVAS#ffffff" \
"DEF:ping1=/var/lib/smokeping/.rrd:ping1:AVERAGE" \
"DEF:ping2=/var/lib/smokeping/.rrd:ping2:AVERAGE" \
"DEF:ping3=/var/lib/smokeping/.rrd:ping3:AVERAGE" \
"DEF:ping4=/var/lib/smokeping/.rrd:ping4:AVERAGE" \
"DEF:ping5=/var/lib/smokeping/.rrd:ping5:AVERAGE" \
"DEF:ping6=/var/lib/smokeping/.rrd:ping6:AVERAGE" \
"DEF:ping7=/var/lib/smokeping/.rrd:ping7:AVERAGE" \
"DEF:ping8=/var/lib/smokeping/.rrd:ping8:AVERAGE" \
"DEF:ping9=/var/lib/smokeping/.rrd:ping9:AVERAGE" \
"DEF:ping10=/var/lib/smokeping/.rrd:ping10:AVERAGE" \
"DEF:ping11=/var/lib/smokeping/.rrd:ping11:AVERAGE" \
"DEF:ping12=/var/lib/smokeping/.rrd:ping12:AVERAGE" \
"DEF:ping13=/var/lib/smokeping/.rrd:ping13:AVERAGE" \
"DEF:ping14=/var/lib/smokeping/.rrd:ping14:AVERAGE" \
"DEF:ping15=/var/lib/smokeping/.rrd:ping15:AVERAGE" \
"DEF:ping16=/var/lib/smokeping/.rrd:ping16:AVERAGE" \
"DEF:ping17=/var/lib/smokeping/.rrd:ping17:AVERAGE" \
"DEF:ping18=/var/lib/smokeping/.rrd:ping18:AVERAGE" \
"DEF:ping19=/var/lib/smokeping/.rrd:ping19:AVERAGE" \
"DEF:ping20=/var/lib/smokeping/.rrd:ping20:AVERAGE" \
"CDEF:cp1=ping1,0.08767488,LT,ping1,INF,IF" \
"CDEF:cp2=ping2,0.08767488,LT,ping2,INF,IF" \
"CDEF:cp3=ping3,0.08767488,LT,ping3,INF,IF" \
"CDEF:cp4=ping4,0.08767488,LT,ping4,INF,IF" \
"CDEF:cp5=ping5,0.08767488,LT,ping5,INF,IF" \
"CDEF:cp6=ping6,0.08767488,LT,ping6,INF,IF" \
"CDEF:cp7=ping7,0.08767488,LT,ping7,INF,IF" \
"CDEF:cp8=ping8,0.08767488,LT,ping8,INF,IF" \
"CDEF:cp9=ping9,0.08767488,LT,ping9,INF,IF" \
"CDEF:cp10=ping10,0.08767488,LT,ping10,INF,IF" \
"CDEF:cp11=ping11,0.08767488,LT,ping11,INF,IF" \
"CDEF:cp12=ping12,0.08767488,LT,ping12,INF,IF" \
"CDEF:cp13=ping13,0.08767488,LT,ping13,INF,IF" \
"CDEF:cp14=ping14,0.08767488,LT,ping14,INF,IF" \
"CDEF:cp15=ping15,0.08767488,LT,ping15,INF,IF" \
"CDEF:cp16=ping16,0.08767488,LT,ping16,INF,IF" \
"CDEF:cp17=ping17,0.08767488,LT,ping17,INF,IF" \
"CDEF:cp18=ping18,0.08767488,LT,ping18,INF,IF" \
"CDEF:cp19=ping19,0.08767488,LT,ping19,INF,IF" \
"CDEF:cp20=ping20,0.08767488,LT,ping20,INF,IF" \
"DEF:loss=/var/lib/smokeping/.rrd:loss:AVERAGE" \
"CDEF:smoke1=cp1,UN,UNKN,cp20,cp1,-,IF" \
"AREA:cp1" \
"STACK:smoke1#dddddd" \
"CDEF:smoke2=cp2,UN,UNKN,cp19,cp2,-,IF" \
"AREA:cp2" \
"STACK:smoke2#cacaca" \
"CDEF:smoke3=cp3,UN,UNKN,cp18,cp3,-,IF" \
"AREA:cp3" \
"STACK:smoke3#b7b7b7" \
"CDEF:smoke4=cp4,UN,UNKN,cp17,cp4,-,IF" \
"AREA:cp4" \
"STACK:smoke4#a4a4a4" \
"CDEF:smoke5=cp5,UN,UNKN,cp16,cp5,-,IF" \
"AREA:cp5" \
"STACK:smoke5#919191" \
"CDEF:smoke6=cp6,UN,UNKN,cp15,cp6,-,IF" \
"AREA:cp6" \
"STACK:smoke6#7e7e7e" \
"CDEF:smoke7=cp7,UN,UNKN,cp14,cp7,-,IF" \
"AREA:cp7" \
"STACK:smoke7#6b6b6b" \
"CDEF:smoke8=cp8,UN,UNKN,cp13,cp8,-,IF" \
"AREA:cp8" \
"STACK:smoke8#585858" \
"CDEF:smoke9=cp9,UN,UNKN,cp12,cp9,-,IF" \
"AREA:cp9" \
"STACK:smoke9#454545" \
"CDEF:smoke10=cp10,UN,UNKN,cp11,cp10,-,IF" \
"AREA:cp10" \
"STACK:smoke10#323232" \
"DEF:median=/var/lib/smokeping/.rrd:median:AVERAGE" \
"CDEF:ploss=loss,20,/,100,*" \
"VDEF:avmed=median,AVERAGE" \
"CDEF:mesd=median,POP,avmed,0.00692652790837922,/" \
"GPRINT:avmed:median rtt\: %.1lf %ss avg" \
"GPRINT:median:MAX:%.1lf %ss max" \
"GPRINT:median:MIN:%.1lf %ss min" \
"GPRINT:median:LAST:%.1lf %ss now" \
"COMMENT:6.9 ms sd" \
"GPRINT:mesd:AVERAGE:%.1lf %s am/s\l" \
"LINE1:median#202020" \
"GPRINT:ploss:AVERAGE:packet loss\: %.2lf %% avg" \
"GPRINT:ploss:MAX:%.2lf %% max" \
"GPRINT:ploss:MIN:%.2lf %% min" \
"GPRINT:ploss:LAST:%.2lf %% now\l" \
"COMMENT:loss color\:" \
"CDEF:me0=loss,-1,GT,loss,0,LE,*,1,UNKN,IF,median,*" \
"CDEF:meL0=me0,0.0004383744,-" \
"CDEF:meH0=me0,0,*,0.0004383744,2,*,+" \
"AREA:meL0" \
"STACK:meH0#26ff00:0" \
"CDEF:me1=loss,0,GT,loss,1,LE,*,1,UNKN,IF,median,*" \
"CDEF:meL1=me1,0.0004383744,-" \
"CDEF:meH1=me1,0,*,0.0004383744,2,*,+" \
"AREA:meL1" \
"STACK:meH1#00b8ff:1/20" \
"CDEF:me2=loss,1,GT,loss,2,LE,*,1,UNKN,IF,median,*" \
"CDEF:meL2=me2,0.0004383744,-" \
"CDEF:meH2=me2,0,*,0.0004383744,2,*,+" \
"AREA:meL2" \
"STACK:meH2#0059ff:2/20" \
"CDEF:me3=loss,2,GT,loss,3,LE,*,1,UNKN,IF,median,*" \
"CDEF:meL3=me3,0.0004383744,-" \
"CDEF:meH3=me3,0,*,0.0004383744,2,*,+" \
"AREA:meL3" \
"STACK:meH3#5e00ff:3/20" \
"CDEF:me4=loss,3,GT,loss,4,LE,*,1,UNKN,IF,median,*" \
"CDEF:meL4=me4,0.0004383744,-" \
"CDEF:meH4=me4,0,*,0.0004383744,2,*,+" \
"AREA:meL4" \
"STACK:meH4#7e00ff:4/20" \
"CDEF:me10=loss,4,GT,loss,10,LE,*,1,UNKN,IF,median,*" \
"CDEF:meL10=me10,0.0004383744,-" \
"CDEF:meH10=me10,0,*,0.0004383744,2,*,+" \
"AREA:meL10" \
"STACK:meH10#dd00ff:10/20" \
"CDEF:me19=loss,10,GT,loss,19,LE,*,1,UNKN,IF,median,*" \
"CDEF:meL19=me19,0.0004383744,-" \
"CDEF:meH19=me19,0,*,0.0004383744,2,*,+" \
"AREA:meL19" \
"STACK:meH19#ff0000:19/20" \
"COMMENT: \l" \
"HRULE:0#000000"<br />1

