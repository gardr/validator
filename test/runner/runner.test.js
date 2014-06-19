var path = require('path');
var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var proxyquire = require('proxyquire');

var EXPECTED_VALID_REPORT_OBJECT = {
    'path': 'DUMMY',
    'key1': {},
    'key2': {},
    'key3': {}
};

var mockedRunner = proxyquire('../../lib/index.js', {
    'fs': {
        readFile: function(fileName, cb){
            cb(null, JSON.stringify(EXPECTED_VALID_REPORT_OBJECT));
        }
    },
    './spawn.js': function (options, handler, done) {
        var dummy = {path: '...', timestamp: Date.now()};
        var result = JSON.stringify(dummy);
        handler(result, done);
    },
    './validate.js': {
        validate: function (data, validators, done) {
            done(null, {});
        }
    }
});

var HOOKY_PATH = path.resolve(path.join(__dirname, 'fixtures', 'customhook', 'hooky.js'));

describe('Runner (phantomJs)', function () {

    it('should require a option object', function (done) {
        mockedRunner.run(null, function (err, reportObj) {
            assert(err);
            refute(reportObj);
            done();
        });
    });

    it('should require a intrument object with hooks or validators', function (done) {
        mockedRunner.run({
            'parentUrl': 'valid',
            'instrument': ['notValid']
        }, function (err, reportObj) {
            assert(err, 'Expected a error');
            refute(reportObj);
            done();
        });
    });

    it('should call spawn when options are valid', function (done) {
        var options = {
            // test gets default (all) validators
            // 'instrument': [],
            // 'validate': [],
            // 'preprocess': []
        };
        var called = 0;
        mockedRunner.run(options, function (err, reportObj) {
            called++;
            assert.equals(called, 1, 'should not call callback more than once');
            //console.log(err, err.stack);
            refute(err, 'should not return error');
            assert.isObject(reportObj);
            done();
        });
    });

    describe('handleResult', function () {
        it('should return an error when parsing invalid json result', function (done) {
            var strInput1 = 'ssomeasdøasldøsad';
            mockedRunner.handleResult(strInput1, function (err, dataObj) {
                assert.isObject(err, 'should return an error');
                assert.isNull(dataObj);
                done();
            });
        });

        it('should parse result from runner as success', function (done) {
            // feature is to return a data object when given correct input
            var input1 = EXPECTED_VALID_REPORT_OBJECT;
            var strInput1 = JSON.stringify(input1);

            mockedRunner.handleResult(strInput1, function (err, dataObj) {
                if(err){
                    console.log('runner.js test error', err);
                }
                assert.isNull(err, 'no error expected');
                assert.isObject(dataObj);
                assert.equals(dataObj, input1);
                done();
            });
        });

        it('should parse result with systemError:true as error', function (done) {
            var input1 = {
                // 'path': 'dummy',
                'systemError': {
                    message: 'huzzlas'
                }
            };
            var strInput1 = JSON.stringify(input1);
            mockedRunner.handleResult(strInput1, function (err, dataObj) {
                assert.isNull(dataObj);
                assert.isObject(err);
                assert.equals(err, input1.systemError);
                done();
            });
        });

        it('should not try to parse undefined', function () {
            mockedRunner.handleResult(undefined, function (err, dataObj) {
                assert(err);
                refute(dataObj);
            });
        });

    });

    describe('full tests', function () {
        var runner = require('../../lib/index.js');
        var os = require('os');

        it('should run with default config', function (done) {
            var options = {
                'pageRunTime': 25,
                'outputDirectory': os.tmpDir()
            };
            runner.run(options, function (err, result) {
                if (err) {
                    console.log('TEST RUN ERROR', err);
                }
                refute(err);
                assert(result);
                done();
            });
        });

        it('should run with log instrumentation', function (done) {
            this.timeout(3000);
            var options = {
                'instrument': ['log'],
                'pageRunTime': 25,
                'outputDirectory': os.tmpDir()
            };
            runner.run(options, function (err, result) {
                if (err) {
                    console.log('TEST RUN ERROR:', err);
                }
                refute(err);
                assert(result.log.logs, 'expected a log');
                done();
            });
        });

        // it('should run with bugged code', function(done){
        //     var baseTime = 10000;
        //     this.timeout(baseTime + 5000);
        //     var tmps = os.tmpDir();
        //     var options = {
        //         'instrument': [
        //             'timers',
        //             'gardr',
        //             'log'
        //         ],
        //         'preprocess': [],
        //         'validate': [
        //             'timers'
        //         ],
        //         'pageRunTime': baseTime,
        //         'outputDirectory': tmps,
        //         'scriptUrl': 'http://localhost:8000/user-entry.js?id=6cca6201-a33e-410c-9353-124b9aaffda6-131158-000006&timestamp=1402653620259'
        //     };
        //     runner.run(options, function (err, result) {
        //         if (err) {
        //             console.log('TEST RUN ERROR', err);
        //         }
        //         console.log('\n-------------------');
        //         console.log(tmps);
        //         console.log('\n-------------------');
        //         console.log(result);
        //         console.log('\n-------------------');
        //         console.log(result.timers.setTimeout[0].length);
        //         console.log(result.timers.clearTimeout[0]);
        //
        //         done();
        //     });
        // });

        it('should run with multiple instrumentations', function (done) {
            this.timeout(3000);
            var options = {
                'instrument': [
                    'har',
                    'common',
                    'log',
                    {
                        name: 'hooky',
                        path: HOOKY_PATH
                    }
                ],
                'preprocess': [
                    'har',
                    'log'
                ],
                'validate': [
                    'common',
                    'log'
                ],
                'pageRunTime': 100,
                'outputDirectory': os.tmpDir()
            };
            runner.run(options, function (err, result) {
                if (err) {
                    console.log('TEST RUN ERROR', err);
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
