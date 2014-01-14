test:
	./node_modules/.bin/mocha --reporter list
	./test/integration.sh

.PHONY: test
