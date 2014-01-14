echo "# config.interval: 1"
echo "# graph.title: Disk space"
echo "# graph.verticalLabel: Used in %"
df --portability --sync --local \
 |egrep -v ^Filesystem \
 |awk '{print $1" "$5}' \
 |sort -u -k1,1 \
 |sed 's/%//g'
