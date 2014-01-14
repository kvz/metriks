echo "# config.interval: 1"
echo "# graph.title: Uptime"
echo "# graph.lineColors.0: #D73A3FFF"
echo "# graph.lineColors.1: #9AEBEAFF"
echo "# graph.lineColors.2: #FF0051FF"
awk '{print $NF}' /proc/uptime
