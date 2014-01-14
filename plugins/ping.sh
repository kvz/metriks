echo "# config.interval: 1"
echo "# graph.title: ping www.google.com"
echo "# graph.verticalLabel: Roundtrip in ms"
echo "# graph.lineColors.0: #D73A3FFF"
ping -c 4 www.google.com | tail -1| awk '{print $4}' | cut -d '/' -f 2
