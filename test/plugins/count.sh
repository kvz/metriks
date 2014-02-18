#!/usr/bin/env bash
echo '# config->interval: 1'
echo "# graphStore->step: 2"
echo "# graph->start: end-5s"
echo '# graph->step: 1'
echo "# lineStore->*->dsType: COUNTER"
echo "# line->1->color: #FFFFFFFF"
echo "# line->1->title: One"
echo 1 1.1
echo "# line->2->color: #000000FF"
echo "# line->2->title: Two"
echo 2 2.2
echo "# line->8.8.8.8->color: #FF0000FF"
echo "# line->8.8.8.8->title: IP 8.8.8.8"
echo "# lineStore->8.8.8.8->heartBeat: 599"
echo 8.8.8.8 3.3
