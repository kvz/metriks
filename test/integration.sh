#!/usr/bin/env bash

__DIR__="$(cd "$(dirname "${0}")"; echo $(pwd))"


rm -rf /tmp/metriks

timeout 2s node index.js \
 --png-dir /tmp/metriks/png \
 --rrd-dir /tmp/metriks/rrd \
 --auto-write-png \
 --plugin-dir ${__DIR__}/plugins

if [ "${?}" -ne 124 ]; then
  exit 1
fi

rrdtool info /tmp/metriks/rrd/one/$(hostname)-one.rrd |tee /tmp/metriks/info.txt

grep 'ds\[one\].last_ds = "1"' /tmp/metriks/info.txt || exit 1

echo "Done. Integration test passed. "
