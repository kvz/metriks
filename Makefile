test:
	cp -f ./test/ping.rrd ./test/temp.rrd
	./node_modules/.bin/mocha --reporter list
	# rm -f ./test/temp.rrd

test-int:
	@make test || true
	./test/integration.sh

.PHONY: test test-int
