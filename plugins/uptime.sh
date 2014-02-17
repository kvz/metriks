#!/usr/bin/env bash
echo "# config->interval: 60"
echo "# graph->title: Uptime"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # OSX has no /proc
  sysctl -n kern.boottime | cut -c14-18
else
  awk '{print $NF}' /proc/uptime
fi
