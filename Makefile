test:
	cp -f ./test/ping.rrd ./test/temp.rrd
	./node_modules/.bin/mocha --reporter list
	# rm -f ./test/temp.rrd

test-int: test
	./test/integration.sh

.PHONY: test test-int
