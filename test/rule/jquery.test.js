var referee = require('referee');
var assert = referee.assert;
var refute = referee.refute;

var proxyquire = require('proxyquire');

var help = require('../lib/validateHelpers.js');
var instrumentation = require('../../lib/rule/instrument/jquery.js');

describe('jQuery instrumentation', function () {

    it('should call wrap', function () {

        var calls = 0;
        var api = {
            wrap: function () {
                calls++;
            }
        };

        instrumentation.onResourceReceived({
            url: 'someUrl',
            stage: 'end'
        }, api);

        assert.equals(calls, 0);

        instrumentation.onResourceReceived({
            url: 'jquery.js',
            stage: 'start'
        }, api);

        assert.equals(calls, 0);

        instrumentation.onResourceReceived({
            url: 'jquery.js',
            stage: 'end'
        }, api);

        assert.equals(calls, 1);

        instrumentation.onResourceReceived({
            url: 'jquery.js',
            stage: 'end'
        }, api);

        assert.equals(calls, 1, 'should only wrap once');
    });

    it('should collect wrapped and jquery version', function () {

        var calls = 0;
        var result = {jquery: {}};
        var key = ('12345'+Math.round(Math.random()+Date.now()));
        var apiShim = {
            switchToIframe: function () {
                calls++;
            },
            set: function (key, value) {
                result.jquery[key] = value;
            },
            evaluate: function (fn) {
                global.window = {jQuery: {fn: {jquery: key}}};
                calls++;
                var result = fn();
                global.window = undefined;
                return result;
            }
        };

        instrumentation.onBeforeExit(apiShim);

        assert.equals(calls, 2);
        assert.equals(result.jquery.version, key);

    });

});

var jqueryValidator = require('../../lib/rule/validate/jquery.js');


// function shimLatest(nr, cb) {
//     cb([{ major: 1, minor: 10, patch: 2, sortKey: 11002},
//         { major: 2, minor: 0,  patch: 3, sortKey: 20003}
//        ]);
// }
// var jqueryPreprocessor = proxyquire('../../lib/rule/preprocess/jquery.js', {
//     '../lib/getLatestJquery.js': {
//         'getLatest': shimLatest
//     }
// });

describe('jQuery validator', function () {

    it('should report error if animate called', function (done) {
        var harvested = {
            jquery: {
                animate: [
                    [help.getTraceObject(1), help.getTraceObject(2), help.getTraceObject(3)],
                    [help.getTraceObject(4), help.getTraceObject(5), help.getTraceObject(6)]
                ]
            }
        };

        var report = help.createReporter.call(this);

        jqueryValidator.validate(harvested, report, function () {
            var result = report.getResult();
            assert.equals(result.error.length, 2);
            done();
        });

    });

    it('should report error when version doesnt match latest', function (done) {
        this.timeout(3000);
        var report = help.createReporter.call(this);
        var harvested = {
            jquery: { version: '1.10.1' }
        };

        function output(key, value){
            harvested.jquery[key] = value;
        }

        help.callPreprocessor('jquery', harvested, output, function(){
            help.callValidator('jquery', harvested, report, function () {
                var result = report.getResult();
                assert.equals(result.error.length, 1);
                done();
            });
        }, {});

    });
});

var getLatestJquery = proxyquire('../../lib/rule/lib/getLatestJquery.js', {
    request: function(url, opt, cb){
        setTimeout(function(){
            cb(null, {}, JSON.stringify(require('./fixtures/tags.js')));
        }, 1);
    }
});

describe('getLatestJquery', function () {

    it('should fetch 2 tags from jquery github repo tags, and return same object', function(done){
        this.timeout(100);
        getLatestJquery.getLatest(1, function(tags){
            getLatestJquery.getLatest(1, function(tagsCached){
                assert.equals(tags, tagsCached);
                assert.equals(tags.length, 2);
                done();
            });
        });
    });


    it('should fetch 3 tags', function(done){
        this.timeout(100);
        getLatestJquery.getLatest(3, function(tags){
            assert.equals(tags.length, 6);
            done();
        });

    });

});
