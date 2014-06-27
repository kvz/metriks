SHELL := /bin/bash
COFFEE     = node_modules/.bin/coffee
COFFEELINT = node_modules/.bin/coffeelint
MOCHA      = node_modules/.bin/mocha --compilers coffee:coffee-script --require "coffee-script/register"
REPORTER   = nyan

lint:
	@[ ! -f coffeelint.json ] && $(COFFEELINT) --makeconfig > coffeelint.json || true
	$(COFFEELINT) --file ./coffeelint.json src

# build:
# 	make lint || true
# 	$(COFFEE) $(CSOPTS) -c -o lib src/airbud.coffee
#
# test: build
# 	$(MOCHA) --reporter $(REPORTER) test/ --grep "$(GREP)"

test:
	cp -f ./test/ping.rrd ./test/temp.rrd
	./node_modules/.bin/mocha --reporter list
	# rm -f ./test/temp.rrd

test-int:
	@make lint || true
	@make test || true
	./test/integration.sh


# compile:
# 	@echo "Compiling files"
# 	time make build
#
# watch:
# 	watch -n 2 make -s compile

release-major: build test
	npm version major -m "Release %s"
	git push
	npm publish

release-minor: build test
	npm version minor -m "Release %s"
	git push
	npm publish

release-patch: build test
	npm version patch -m "Release %s"
	git push
	npm publish

.PHONY: test lint build release compile watch
