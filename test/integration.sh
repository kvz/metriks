#!/usr/bin/env bash

__DIR__="$(cd "$(dirname "${0}")"; echo $(pwd))"
set -x
TIMEOUT=""
[ -z "${TIMEOUT}" ] && which timeout >/dev/null 2>&1 && TIMEOUT=timeout
[ -z "${TIMEOUT}" ] && which gtimeout >/dev/null 2>&1 && TIMEOUT=gtimeout
[ -z "${TIMEOUT}" ] && echo "No timeout command found. Required for integration test. " && exit 1

rm -rf /tmp/metriks

${TIMEOUT} 5s node index.js \
 --png-dir /tmp/metriks/png \
 --rrd-dir /tmp/metriks/rrd \
 --auto-write-png \
 --plugin-dir ${__DIR__}/plugins

if [ "${?}" -ne 124 ]; then
  exit 1
fi

rrdtool info /tmp/metriks/rrd/one/$(hostname)-one.rrd |tee /tmp/metriks/info.txt

grep 'ds\[one\].last_ds = "1"' /tmp/metriks/info.txt || exit 1

if which open >/dev/null 2>&1; then
  open /tmp/metriks/png/one/$(hostname)-one.png
fi

echo "Done. Integration test passed. "
