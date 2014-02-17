echo "# config->interval: 60"
echo "# graph->title: Test resolving nameservers"
echo "# graph->verticalLabel: Response in ms"
servers="Google:8.8.8.8 Google:8.8.4.4 Level3:4.2.2.2 OpenDNS:208.67.222.222 AmazonEC2:172.16.0.23"

i=0
for server in ${servers}; do
  title="$(echo ${server} |cut -d: -f1)"
  ip="$(echo ${server} |cut -d: -f2)"
  echo "# graph->lines->${ip}->title: ${title} ${ip}"
  echo "# graph->lines->${ip}->element: AREA"
  echo "# graph->lines->${ip}->consolidation: AVERAGE"
  let "i=i+1"
done

if [ "${1}" = "config" ]; then
  # Don't check hosts when we're just loading the plugins
  exit 0
fi

i=0
for server in $(echo ${servers}); do
  ip="$(echo ${server} |cut -d: -f2)"
  result=$(dig +retry=1 +tries=1 +time=3 transloadit.com @${ip} |awk '/^;; Query time:/ {print $4}')
  if [ $? -ne 0 ] || [ -z "${result}" ]; then
    result=-1
  fi
  echo "${ip} ${result}"
  let "i=i+1"
done

# Don't let any error during dig crash the plugin:
exit 0
