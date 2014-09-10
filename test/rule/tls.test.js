var referee = require('referee');
var assert = referee.assert;

var help = require('../lib/validateHelpers.js');

describe('TLS validator', function () {

    it('should not error on valid tls', function (done) {
        var harvest = {
            har: {
                validTls: true
            }
        };

        function mutateOptions(context, config){
            config.config.har.errorOnTls = true;
        }

        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 0);
            done();
        }, mutateOptions);
    });

    it('should not error on valid tls', function (done) {
        var harvest = {
            har: {
                validTls: false
            }
        };

        function mutateOptions(context, config){
            config.config.har.errorOnTls = true;
        }


        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1);
            done();
        }, mutateOptions);
    });

    it('should warm when error on invalid tls', function (done) {
        var harvest = {
            har: {
                validTls: false
            }
        };

        var reporter = help.createReporter.call(this);

        function mutateOptions(context, config){
            config.config.har.errorOnTls = false;
        }

        help.callValidator('tls', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 0, 'Expected NO error');
            assert.equals(result.warn.length, 1, 'Expected a warning');
            done();
        }, mutateOptions);
    });

    it('should not report when turned off', function (done) {
        var harvest = {

        };

        var reporter = help.createReporter.call(this);

        function mutateOptions(context, config){
            config.config.har.checkTls = false;
        }

        help.callValidator('tls', harvest, reporter, function () {
            var result = reporter.getResult();

            assert.equals(result.checklist.length, 0, 'Expected no checklist');

            done();
        }, mutateOptions);
    });

    it('should report failing urls', function (done) {
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

        function mutateOptions(context, config){
            config.config.har.errorOnTls = true;
        }

        var reporter = help.createReporter.call(this);
        help.callValidator('tls', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1);

            var entry = result.error[0].data.list[0];
            assert(entry.indexOf(domain) === 0);
            assert(entry.indexOf('404') === entry.length - 3);
            done();
        }, mutateOptions);
    });

});