var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var mockery = require('mockery');
var help = require('../lib/validateHelpers.js');



describe('Security', function() {

    function requestMock() {
        throw new Error('Mock only supports get and post methods');
    }

    var resPayload = {};
    requestMock.get = requestMock.post = function(options, responseCallback) {
        responseCallback(null, {
            statusCode: resPayload.statusCode || 200
        }, resPayload.body);
    };

    beforeEach(function() {
        // remove mockery warnings:
        ['safe-browse', './lib/safe_browse', '../../safeURL.js',
            'underscore', 'http', 'url', 'util',
            'querystring', 'events', '../../lib/safeURL.js',
            '../../lib/rule/preprocess/security.js'
        ].forEach(function(v) {
            mockery.registerAllowable(v);
        });
        mockery.registerMock('request', requestMock);
        mockery.enable({
            useCleanCache: true
        });
    });


    it('SafeURL should cache requests', function(done) {
        var safeURL = require('../../lib/safeURL.js');
        var urls = ['http://url1.com/', 'http://www.url2.no/'];

        resPayload.body = 'malware\nok';
        safeURL(urls, function(err1, data1) {
            resPayload.body = 'cached, should not hit this';
            safeURL(urls, function(err2, data) {
                refute(err1);
                refute(err2);
                assert(data1);
                assert.equals(data[urls[0]], 'malware');
                assert.equals(data[urls[1]], 'ok');
                done();
            });
        });
    });


    describe('preprocessor', function() {


        it('should collect domains', function(done) {


            function getObj(url) {
                return {
                    request: {
                        url: url
                    }
                };
            }

            var harvested = {
                har: {
                    input: {
                        resources: [getObj('http://domain0.com'),
                            getObj('http://domain1.com'), getObj(
                                'http://domain2.com'), getObj(
                                'http://domain1.com')
                        ],
                        startTime: null,
                        endTime: null
                    }
                }
            };

            var called = 0;
            var outputData = {};
            var output = function(key, value) {
                called++;

                outputData[key] = value;
            };

            var inputBody = resPayload.body =
                'malware\nok\nmalware';

            help.callPreprocessor('security', harvested, output,
                function() {
                    assert.equals(called, 2);
                    // console.log('outputData', outputData);

                    assert.isArray(outputData.domains);
                    assert.equals(outputData.domains.length,
                        3);

                    assert.isObject(outputData.domainsResult);
                    assert.equals(Object.keys(outputData.domainsResult)
                        .length, 3);


                    inputBody.split('\n').forEach(function(val, i) {
                        assert.equals(outputData.domainsResult[
                                'http://domain' + i + '.com'],
                            val);
                    });


                    done();
                });

        });

    });



    afterEach(function() {
        mockery.disable();
        mockery.deregisterAll();
    });


});


describe('Security validator', function() {

    it('should error if domains has malware', function(done) {
        var harvested = {
            'security': {
                'domainsResult': {
                    'domain0': 'ok',
                    'domain1': 'malware',
                    'domain2': 'ok'
                }
            }
        };
        var reporter = help.createReporter.call(this);

        help.callValidator('security', harvested, reporter, handler);

        function handler() {
            var report = reporter.getResult();
            assert.equals(report.error.length, 1);
            done();
        }

    });

    it('should pass if domain is ok', function(done) {
        var harvested = {
            'security': {
                'domainResult': {
                    'domain0': 'ok'
                }
            }
        };
        var reporter = help.createReporter.call(this);

        help.callValidator('security', harvested, reporter, handler);

        function handler() {
            var report = reporter.getResult();
            assert.equals(report.error.length, 0);
            done();
        }

    });


});
