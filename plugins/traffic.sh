#!/usr/bin/env bash
echo "# graph->title: Network traffic in/out per interface"
echo "# graph->verticalLabel: bits / s"

echo "# line->*->element: AREA"
echo "# lineStore->*->consolidation: AVERAGE"
echo "# lineStore->*->dsType: COUNTER"

if [[ "$OSTYPE" == "darwin"* ]]; then
  (
    netstat -ib |awk '{print $1"-in " $7*8}' &&
    netstat -ib |awk '{print $1"-out " $10*8}'
  ) |egrep -v '^(gif|stf|bridg|ham|p2p|lo|vbox|Name)' |sort -u
else
  (
    cat /proc/net/dev |awk '{print $1"-in " $2*8}' &&
    cat /proc/net/dev |awk '{print $1"-out " $10*8}'
  ) |tail -n-2 |sed 's/://g' |egrep -v '^(lo)'
fi
