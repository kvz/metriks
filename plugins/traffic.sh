#!/usr/bin/env bash
# @todo: We need to support COUNTER for this one
echo "# graph->title: Network traffic in/out per interface"
echo "# graph->verticalLabel: Bytes"
if [[ "$OSTYPE" == "darwin"* ]]; then
  netstat -ib |awk '{print $1"-in " $7}' |egrep -v '^(gif|stf|lo|vbox|Name)'
  netstat -ib |awk '{print $1"-out " $10}' |egrep -v '^(gif|stf|lo|vbox|Name)'
else
  cat /proc/net/dev |tail -n-2 |sed 's/://g' |awk '{print $1"-in " $2}' |egrep -v '^(lo)'
  cat /proc/net/dev |tail -n-2  |sed 's/://g' |awk '{print $1"-out " $10}' |egrep -v '^(lo)'
fi
