#!/usr/bin/env bash
echo "# config.interval: 60"
echo "# graph.title: Ping resolving nameservers"
echo "# graph.verticalLabel: Roundtrip in ms"
echo "# graph.lines.ip_8.8.8.8.color: #D73A3FFF"

servers="Google:8.8.8.8 Level3:4.2.2.2 OpenDNS:208.67.222.222 AmazonEC2:172.16.0.23"

i=0
for server in ${servers}; do
  title="$(echo ${server} |cut -d: -f1)"
  ip="$(echo ${server} |cut -d: -f2)"
  echo "# graph->lines->ip_${ip}->title: ${title} ${ip}"
  let "i=i+1"
done

if [ "${1}" = "config" ]; then
  # Don't check hosts when we're just loading the plugins
  exit 0
fi

i=0
for server in $(echo ${servers}); do
  ip="$(echo ${server} |cut -d: -f2)"
  result=$(ping -c 4 ${ip} | tail -1| awk '{print $4}' | cut -d '/' -f 2)
  if [ $? -ne 0 ] || [ -z "${result}" ]; then
    result=-1
  fi
  echo "ip_${ip} ${result}"
  let "i=i+1"
done

# Don't let any error during ping crash the plugin:
exit 0
