#!/usr/bin/env bash

__DIR__="$(cd "$(dirname "${0}")"; echo $(pwd))"


rm -rf /tmp/metrik

timeout 2s node index.js \
 --png-dir /tmp/metrik/png \
 --rrd-dir /tmp/metrik/rrd \
 --auto-write-png \
 --plugin-dir ${__DIR__}/plugins

if [ "${?}" -ne 124 ]; then
  exit 1
fi

rrdtool info /tmp/metrik/rrd/one/$(hostname)-one.rrd |tee /tmp/metrik/info.txt

grep 'ds\[one\].last_ds = "1"' /tmp/metrik/info.txt || exit 1

echo "Done. Integration test passed. "
