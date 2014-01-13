REPORTER = spec
TESTS_GLOB = test/**/*.test.js
test:
	@$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha $(TESTS_GLOB) -b --reporter $(REPORTER)

lint:
	./node_modules/.bin/jshint ./lib

test-cov:
	$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/.bin/_mocha $(TESTS_GLOB) -- -R $(REPORTER)

test-coveralls:
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha $(TESTS_GLOB) --report lcovonly -- -R $(REPORTER) && \
		cat ./coverage/lcov.info | ./node_modules/.bin/coveralls && rm -rf ./coverage