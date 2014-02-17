echo "# config.interval: 60"
echo "# graph.title: Uptime"
echo "# graph.lineColors.0: #D73A3FFF"
echo "# graph.lineColors.1: #9AEBEAFF"
echo "# graph.lineColors.2: #FF0051FF"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # OSX has no /proc
  sysctl -n kern.boottime | cut -c14-18
else
  awk '{print $NF}' /proc/uptime
fi
