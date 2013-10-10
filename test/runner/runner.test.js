var path = require('path');
var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var proxyquire = require('proxyquire');

var EXPECTED_VALID_REPORT_OBJECT = {
    har: {},
    clientHar: {},
    probes: {}
};

var runner = proxyquire('../../lib/runner.js', {
    './spawn.js': function (options, handler, done) {
        var result = JSON.stringify(EXPECTED_VALID_REPORT_OBJECT);
        handler(result, done);
    }
});

describe('Validation runner (phantomJs)', function () {

    it('should require a spec', function (done) {
        runner.run({
            pageUrl: 'about:blank',
            spec: null
        }, function (err, reportObj) {
            refute.isNull(reportObj);
            done();
        });
    });

    it('should require an object without a pageUrl', function (done) {
        runner.run({
            pageUrl: null,
            spec: {}
        }, function (err, reportObj) {
            assert(err);
            refute(reportObj);
            done();
        });
    });

    it('should require a spec object with hooks or validators', function (done) {
        runner.run({
            pageUrl: 'valid',
            spec: {
                notValid: true
            }
        }, function (err, reportObj) {
            assert(err, 'Expected a error');
            refute(reportObj);
            done();
        });
    });

    it('should call spawn when options are valid', function (done) {
        // The description does not match the test, spawn is an internal unknown to runner
        runner.run({
            pageUrl: 'about:blank',
            spec: {}
        }, function (err, reportObj) {
            assert.isNull(err);
            assert.isObject(reportObj);
            done();
        });
    });


    it('should create a spec file path array', function () {
        // the api says that runner should provide a function to retrieve a spec, not reflected in the test description
        var files = runner.collectSpec({
            timers: true,
            latestJQuery: true
        });

        assert.equals(files.length, 2);
    });

    it('should create a validator file path array', function () {
        // should provide a list of validator result files
        var files = runner.collectValidator({
            timers: true,
            latestJQuery: true
        });

        assert.equals(files.length, 2);
    });

    it('should return error on missing hook or validator files', function (done) {
        // this feature is for retrieval of stat files, not mentioned in the description
        runner.statFiles(['invalid', 'invalid2'], function (err) {
            assert(err);
            done();
        });
    });

    it('should not throw a error if a valid list of files', function (done) {
        var currentFile = path.join(__dirname, 'runner.test.js');
        runner.statFiles([currentFile, currentFile, currentFile], function (err) {
            refute(err);
            done();
        });

    });

    describe('handleResult', function () {
        it('should return an error when parsing invalid json result', function (done) {
            var strInput1 = 'ssomeasdøasldøsad';
            runner.handleResult(strInput1, function (err, dataObj) {
                assert.isObject(err);
                assert.isNull(dataObj);
                done();
            });
        });

        it('should parse result from runner as success', function (done) {
            // feature is to return a data object when given correct input
            var input1 = EXPECTED_VALID_REPORT_OBJECT;
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

        it('should not try to parse undefined', function(){
            runner.handleResult(undefined, function(err, dataObj){
                assert(err);
                refute(dataObj);
            });
        });

    });

    describe('full tests', function(){
        var runner = require('../../lib/runner.js');

        it('should run with default config', function(done){
            var options = {
                pageUrl: 'about:blank',
                spec: {},
                pageRunTime: 0
            };
            runner.run(options, function(err, result){
                refute(err);
                assert(result);
                done();
            });
        });

        it('should run with specs', function(done){
            var options = {
                pageUrl: 'about:blank',
                spec: {log: true},
                pageRunTime: 100
            };
            runner.run(options, function(err, result){
                //console.log('ERROR:', err, 'STDOUT:', result);
                refute(err);
                assert(result.log, 'expected a log');
                done();
            });
        });


    });

});
