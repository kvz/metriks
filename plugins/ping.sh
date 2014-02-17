echo "# config.interval: 60"
echo "# graph.title: Ping resolving nameservers"
echo "# graph.verticalLabel: Roundtrip in ms"
echo "# graph.lineColors.0: #D73A3FFF"

if [ "${1}" = "config" ]; then
  # Don't ping hosts when we're just loading the plugins
  exit 0
fi

echo "ip_8.8.8.8 $(ping -c 4 8.8.8.8 | tail -1| awk '{print $4}' | cut -d '/' -f 2)"
echo "ip_4.2.2.2 $(ping -c 4 4.2.2.2 | tail -1| awk '{print $4}' | cut -d '/' -f 2)"
echo "ip_208.67.222.222 $(ping -c 4 208.67.222.222 | tail -1| awk '{print $4}' | cut -d '/' -f 2)"
echo "ip_172.16.0.23 $(ping -c 4 172.16.0.23 | tail -1| awk '{print $4}' | cut -d '/' -f 2)"

# Don't let any error during ping crash the plugin:
exit 0
