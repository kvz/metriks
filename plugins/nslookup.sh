echo "# config.interval: 60"
echo "# graph.title: Test resolving nameservers"
echo "# graph.verticalLabel: Response in ms"

if [ "${1}" = "config" ]; then
  # Don't check hosts when we're just loading the plugins
  exit 0
fi

i=0

for server in 8.8.8.8 8.8.4.4 4.2.2.2 208.67.222.222 172.16.0.23; do
  result=$(dig +retry=1 +tries=1 +time=3 transloadit.com @${server} |awk '/^;; Query time:/ {print $4}')
  if [ $? -ne 0 ] || [ -z "${result}" ]; then
    result=-1
  fi
  echo "# graph.lineTitles.${i}: ${server}"
  echo "ip_${server} ${result}"
  let "i=i+1";
done

# Don't let any error during ping crash metriks:
exit 0
