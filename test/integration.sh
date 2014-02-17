#!/usr/bin/env bash

__DIR__="$(cd "$(dirname "${0}")"; echo $(pwd))"
set +x
TIMEOUT=""
[ -z "${TIMEOUT}" ] && which timeout >/dev/null 2>&1 && TIMEOUT=timeout
[ -z "${TIMEOUT}" ] && which gtimeout >/dev/null 2>&1 && TIMEOUT=gtimeout
[ -z "${TIMEOUT}" ] && echo "No timeout command found. Required for integration test. " && exit 1

echo "--> Cleaning up environment.."
rm -rf /tmp/metriks

echo "--> Running metriks for 5s.."
${TIMEOUT} 5s bin/metriks \
 --png-dir /tmp/metriks/png \
 --rrd-dir /tmp/metriks/rrd \
 --auto-write-png \
 --plugin-dir ${__DIR__}/plugins

# 124 means metriks was killed by the 5s timeout. Which is good!
if [ "${?}" -ne 124 ]; then
  exit 1
fi

echo "--> Writing rrdtool info file.."
rrdtool info /tmp/metriks/rrd/count/$(hostname)-count.rrd |tee /tmp/metriks/info.txt > /dev/null

echo "--> Checking if rrdtool info file has the correct ds.."
grep 'ds\[1\].last_ds = "1"' /tmp/metriks/info.txt || exit 1
grep 'ds\[2\].last_ds = "2"' /tmp/metriks/info.txt || exit 1

if which open >/dev/null 2>&1; then
  open /tmp/metriks/png/count/$(hostname)-count.png
fi

echo "--> Done. Integration test passed. "
