REPORTER = spec
ISTANBUL = node_modules/istanbul/lib/cli.js
MOCHA = node_modules/mocha/bin/mocha
_MOCHA = node_modules/mocha/bin/_mocha
BROWSERIFY = node_modules/.bin/browserify
JSHINT = node_modules/.bin/jshint
COVERALLS = node_modules/coveralls/bin/coveralls.js
PHANTOM_RESOURCES = lib/phantom/resources/
TESTS_GLOB = test/**/*.test.js
test:
	@$(MAKE) lint
	@$(MAKE) build-gardr-client
	@NODE_ENV=test $(MOCHA) $(TESTS_GLOB) -b --reporter $(REPORTER)
build-gardr-client:
	@ mkdir -p $(PHANTOM_RESOURCES)built
	@ $(BROWSERIFY) $(PHANTOM_RESOURCES)gardr-iframe.js  > $(PHANTOM_RESOURCES)built/gardr-iframe.js
	@ $(BROWSERIFY) $(PHANTOM_RESOURCES)gardr-manager.js > $(PHANTOM_RESOURCES)built/gardr-manager.js
	@ echo "done building gardr resources"
lint:
	$(JSHINT) ./lib --exclude $(PHANTOM_RESOURCES)built
test-cov:
	$(MAKE) lint
	@NODE_ENV=test $(ISTANBUL) cover $(_MOCHA) $(TESTS_GLOB) -- -R $(REPORTER)
test-coveralls:
	@NODE_ENV=test $(ISTANBUL) cover $(_MOCHA) $(TESTS_GLOB) --report lcovonly -- -R $(REPORTER) && cat ./coverage/lcov.info | $(COVERALLS)
.PHONY: all test clean
