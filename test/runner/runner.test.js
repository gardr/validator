var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var proxyquire = require('proxyquire');

var runner = proxyquire('../../lib/runner.js', {
    './spawn.js': function (options, handler, done) {
        handler('{}', done);
    }
});

describe('Validation runner (phantomJs)', function () {

    it('should not accept missing spec', function (done) {
        runner.run({
            pageUrl: 'about:blank',
            spec: null
        }, function (err, reportObj) {
            refute.isNull(reportObj);
            done();
        });
    });

    it('should not accept an object without pageUrl', function (done) {
        runner.run({
            pageUrl: null,
            spec: {}
        }, function (err, reportObj) {
            assert(err instanceof Error);
            refute.isNull(reportObj);
            done();
        });
    });

    it('should call spawn when options are valid', function (done) {
        runner.run({
            pageUrl: 'about:blank',
            spec: {}
        }, function (err, reportObj) {
            refute.isNull(reportObj);
            done();
        });
    });

    it('should create a spec file array', function () {
        var files = runner.collectSpec({
            timers: {
                callsPrSec: 10
            },
            latestJQuery: {
                allowLegacy: true
            }
        });

        assert.equals(files.length, 2);
    });

    describe('handleResult', function () {
        it('should parse invalid json result from runner as error', function (done) {
            var strInput1 = 'ssomeasdøasldøsad';
            runner.handleResult(strInput1, function (err, dataObj) {
                assert.isObject(err);
                assert.isNull(dataObj);
                done();
            });
        });

        it('should parse result from runner as success', function (done) {
            var input1 = {
                har: {},
                clientHar: {},
                probes: {}
            };
            var strInput1 = JSON.stringify(input1);
            runner.handleResult(strInput1, function (err, dataObj) {
                assert.isNull(err);
                assert.isObject(dataObj);
                assert.equals(dataObj, input1);
                done();
            });
        });

        it('should parse result with systemError:true as error', function (done) {
            var input1 = {
                systemError: {
                    message: 'huzzlas'
                }
            };
            var strInput1 = JSON.stringify(input1);
            runner.handleResult(strInput1, function (err, dataObj) {
                assert.isNull(dataObj);
                assert.isObject(err);
                assert.equals(err, input1.systemError);
                done();
            });
        });

    });

});
