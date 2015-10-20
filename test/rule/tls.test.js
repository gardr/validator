var referee = require('referee');
var assert = referee.assert;

var help = require('../lib/validateHelpers.js');

describe('TLS validator', function() {

    it('should not error on valid tls', function(done) {
        var harvest = {
            har: {
                validTls: true
            }
        };

        function mutateOptions(context, config) {
            config.config.har.errorOnTls = true;
        }

        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function() {
            var result = reporter.getResult();
            assert.equals(result.error.length, 0);
            done();
        }, mutateOptions);
    });

    it('should not error on valid tls', function(done) {
        var harvest = {
            har: {
                validTls: false
            }
        };

        function mutateOptions(context, config) {
            config.config.har.errorOnTls = true;
        }


        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function() {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1);
            done();
        }, mutateOptions);
    });

    it('should warm when error on invalid tls', function(done) {
        var harvest = {
            har: {
                validTls: false
            }
        };

        var reporter = help.createReporter.call(this);

        function mutateOptions(context, config) {
            config.config.har.errorOnTls = false;
        }

        help.callValidator('tls', harvest, reporter, function() {
            var result = reporter.getResult();
            assert.equals(result.error.length, 0, 'Expected NO error');
            assert.equals(result.warn.length, 1, 'Expected a warning');
            done();
        }, mutateOptions);
    });

    it('should not report when turned off', function(done) {
        var harvest = {

        };

        var reporter = help.createReporter.call(this);

        function mutateOptions(context, config) {
            config.config.har.checkTls = false;
        }

        help.callValidator('tls', harvest, reporter, function() {
            var result = reporter.getResult();

            assert.equals(result.checklist.length, 0, 'Expected no checklist');

            done();
        }, mutateOptions);
    });

    it('should report failing urls', function(done) {
        var domain = 'https://domain.com';
        var harvest = {
            har: {
                validTls: false,
                failingUrls: [{
                    url: domain,
                    responseCode: 404
                }]
            }
        };

        function mutateOptions(context, config) {
            config.config.har.errorOnTls = true;
        }

        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function() {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1);

            var entry = result.error[0].data.list[0];
            assert(entry.indexOf(domain) === 0);
            assert(entry.indexOf('404') === entry.length - 3);
            done();
        }, mutateOptions);
    });


    it('should report failing urls with errorMessage', function(done) {
        var domain = 'https://domain.com';
        var harvest = {
            har: {
                validTls: false,
                failingUrls: [{
                    url: domain,
                    errorMessage: 'asd',
                    responseCode: undefined
                }]
            }
        };

        function mutateOptions(context, config) {
            config.config.har.errorOnTls = true;
        }

        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function() {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1);

            var entry = result.error[0].data.list[0];
            assert(entry.indexOf(domain) === 0);
            assert(entry.indexOf('asd') === entry.length - 3);
            done();
        }, mutateOptions);
    });

    it('should report on missing https', function(done) {
        var domain = 'https://domain.com';
        var harvest = {
            har: {
                validTls: true,
                "banner": {
                    "rawFileData": {
                        "http://127.0.0.1:8000/user-entry.js?id=1d3d2add-1e96-43a0-8794-62394d4a3ca0-20748-000001&timestamp=1445320135903": {
                            "time": "2015-10-20T05:48:57.131Z",
                            "url": "http://127.0.0.1:8000/user-entry.js?id=1d3d2add-1e96-43a0-8794-62394d4a3ca0-20748-000001&timestamp=1445320135903",
                            "unzippedSize": 477,
                            "redirects": [],
                            "contentType": "application/javascript; charset=utf-8",
                            "bodyLength": 305,
                            "compressed": true,
                            "aproxCompressionPossible": 172,
                            "aproxCompressedSize": 305
                        },
                        "http://cdnjs.cloudflare.com/ajax/libs/gsap/1.18.0/TweenMax.min.js": {
                            "time": "2015-10-20T05:48:57.136Z",
                            "url": "https://cdnjs.cloudflare.com/ajax/libs/gsap/1.18.0/TweenMax.min.js",
                            "validTls": true,
                            "tlsResponseCode": 200,
                            "redirects": [],
                            "contentType": "application/javascript",
                            "bodyLength": 36290,
                            "compressed": true,
                            "unzippedSize": 107961,
                            "aproxCompressionPossible": 72005,
                            "aproxCompressedSize": 35956
                        },
                        "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js": {
                            "time": "2015-10-20T05:48:57.136Z",
                            "url": "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js",
                            "redirects": [],
                            "contentType": "text/javascript; charset=UTF-8",
                            "contentLength": "29524",
                            "bodyLength": 29524,
                            "compressed": true,
                            "validTls": true,
                            "tlsResponseCode": 200,
                            "unzippedSize": 84320,
                            "aproxCompressionPossible": 54758,
                            "aproxCompressedSize": 29562
                        },
                        "http://127.0.0.1:8000/user-entry.js?id=1d3d2add-1e96-43a0-8794-62394d4a3ca0-20748-000001&timestamp=1445320135903&key=js&": {
                            "time": "2015-10-20T05:48:57.137Z",
                            "url": "http://127.0.0.1:8000/user-entry.js?id=1d3d2add-1e96-43a0-8794-62394d4a3ca0-20748-000001&timestamp=1445320135903&key=js&",
                            "unzippedSize": 36,
                            "redirects": [],
                            "contentType": "application/javascript; charset=utf-8",
                            "bodyLength": 56,
                            "compressed": true,
                            "aproxCompressionPossible": -20,
                            "aproxCompressedSize": 56
                        }
                    }


                }
            }
        };

        function mutateOptions(context, config) {
            config.resourceDomainBase = 'http://127.0.0.1:8000';
            config.config.har.forceSecureUrls = true;
        }

        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function() {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1);

            done();
        }, mutateOptions);
    });

});
