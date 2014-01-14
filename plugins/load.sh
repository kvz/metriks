#!/usr/bin/env bash
CORES=$(egrep ^processor /proc/cpuinfo |wc -l)
let "MAX=${CORES} * 3"
echo "# graph.title: Load averages"
echo "# config.interval: 1"
echo "# config.min: 0"
echo "# config.max: ${MAX}"
awk '{print "avg1 "$1}' /proc/loadavg
awk '{print "avg5 "$2}' /proc/loadavg
awk '{print "avg15 "$2}' /proc/loadavg
