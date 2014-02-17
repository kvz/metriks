#!/usr/bin/env bash
if [[ "$OSTYPE" == "darwin"* ]]; then
  # OSX has no /proc
  CORES=$(sysctl hw.ncpu |awk '{print $2}')
else
  CORES=$(egrep ^processor /proc/cpuinfo |wc -l)
fi
let "MAX=${CORES} * 3"
echo "# graph->title: Load averages"
echo "# config->interval: 60"
echo "# config->min: 0"
echo "# config->max: ${MAX}"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # OSX has no /proc
  sysctl -n vm.loadavg |awk '{print "avg1 "$2}'
  sysctl -n vm.loadavg |awk '{print "avg5 "$3}'
  sysctl -n vm.loadavg |awk '{print "avg15 "$4}'
else
  awk '{print "avg1 "$1}' /proc/loadavg
  awk '{print "avg5 "$2}' /proc/loadavg
  awk '{print "avg15 "$2}' /proc/loadavg
fi
