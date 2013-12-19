var path = require('path');
var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var proxyquire = require('proxyquire');

var EXPECTED_VALID_REPORT_OBJECT = {
    har: {},
    clientHar: {},
    probes: {}
};

var runner = proxyquire('../../lib/index.js', {
    './spawn.js': function (options, handler, done) {
        var result = JSON.stringify(EXPECTED_VALID_REPORT_OBJECT);
        handler(result, done);
    },
    './validate.js': function(data, validators, done){
        done(null, {});
    }
});

var HOOKY_PATH = path.resolve(path.join(__dirname, 'fixtures', 'customhook', 'hooky.js'));

describe('Runner (phantomJs)', function () {

    it('should require a hooks key', function (done) {
        runner.run({
            hooks: null
        }, function (err, reportObj) {
            refute.isNull(reportObj);
            done();
        });
    });

    it('should require a hooks object with hooks or validators', function (done) {
        runner.run({
            parentUrl: 'valid',
            hooks: {
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
            hooks: {}
        }, function (err, reportObj) {
            refute(err);
            assert.isObject(reportObj);
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
        var runner = require('../../lib/index.js');

        it('should run with default config', function(done){
            var options = {
                hooks: {},
                pageRunTime: 25
            };
            runner.run(options, function(err, result){
                if (err){
                    console.log(err);
                }
                refute(err);
                assert(result);
                done();
            });
        });

        it('should run with log hooks', function(done){
            this.timeout(3000);
            var options = {
                hooks: {log: true},
                pageRunTime: 25
            };
            runner.run(options, function(err, result){
                if (err){
                    console.log(err);
                }
                refute(err);
                assert(result.log.logs, 'expected a log');
                done();
            });
        });

        it('should run with multiple hooks', function(done){
            this.timeout(3000);
            var options = {
                hooks: {har: true, errors: true, log: true, hooky: HOOKY_PATH },
                preprocessors: {har: true, log: true },
                validators: {errors: true, log: true },
                pageRunTime: 100
            };
            runner.run(options, function(err, result){
                if (err){
                    console.log(err);
                }
                refute(err);
                assert(result.log.logs, 'expected a log');
                assert(result.log.logs.length > 0, 'by default phantom main.js should emit logs');
                assert.equals(result.hooky.spooky, 'wooky', 'results should be namespaced');
                done();
            });
        });

    });

});
