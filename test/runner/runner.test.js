var path = require('path');
var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var proxyquire = require('proxyquire').noPreserveCache();

var HOOKY_PATH = path.resolve(path.join(__dirname, 'fixtures', 'customhook',
    'hooky.js'));

describe('Mocked Runner', function() {
    var EXPECTED_VALID_REPORT_OBJECT = {
        'path': 'DUMMY',
        'key1': {},
        'key2': {},
        'key3': {}
    };

    var mockedRunner = proxyquire('../../lib/index.js', {
        'fs': {
            readFile: function(fileName, cb) {
                cb(null, JSON.stringify(EXPECTED_VALID_REPORT_OBJECT));
            },
            stat: function(fileName, cb){
                cb(null, {size: 1000});
            }
        },
        './spawn.js': function(options, handler, done) {
            var dummy = {
                path: 'PROXYQUIRE_DEBUG...',
                timestamp: Date.now()
            };
            var result = JSON.stringify(dummy);
            handler(result, done);
        },
        './validate.js': {
            validate: function(data, validators, done) {
                done(null, {});
            }
        }
    });
    it('should require a option object', function(done) {
        mockedRunner.run(null, function(err, reportObj) {
            assert(err);
            refute(reportObj);
            done();
        });
    });

    it('should require a intrument object with hooks or validators',
        function(done) {
            mockedRunner.run({
                'parentUrl': 'valid',
                'instrument': ['notValid']
            }, function(err, reportObj) {
                assert(err, 'Expected a error');
                refute(reportObj);
                done();
            });
        });

    it('should call spawn when options are valid', function(done) {
        var options = {
            // test gets default (all) validators
            // 'instrument': [],
            // 'validate': [],
            // 'preprocess': []
        };
        var called = 0;
        mockedRunner.run(options, function(err, reportObj) {
            called++;
            assert.equals(called, 1,
                'should not call callback more than once');
            //console.log(err, err.stack);
            refute(err, 'should not return error');
            assert.isObject(reportObj);
            done();
        });
    });

    describe('handleResult', function() {
        it('should return an error when parsing invalid json result',
            function(done) {
                var strInput1 = 'ssomeasdøasldøsad';
                mockedRunner.handleResult(strInput1, function(err,
                    dataObj) {
                    assert.isObject(err, 'should return an error');
                    assert.isNull(dataObj);
                    done();
                });
            });

        it('should parse result from runner as success', function(done) {
            // feature is to return a data object when given correct input
            var input1 = EXPECTED_VALID_REPORT_OBJECT;
            var strInput1 = JSON.stringify(input1);

            mockedRunner.handleResult(strInput1, function(err,
                dataObj) {
                if (err) {
                    console.log('runner.js test error', err);
                }
                assert.isNull(err, 'no error expected');
                assert.isObject(dataObj);
                assert.equals(dataObj, input1);
                done();
            });
        });

        it('should parse result with systemError:true as error',
            function(done) {
                var input1 = {
                    // 'path': 'dummy',
                    'systemError': {
                        message: 'huzzlas'
                    }
                };
                var strInput1 = JSON.stringify(input1);
                mockedRunner.handleResult(strInput1, function(err,
                    dataObj) {
                    assert.isNull(dataObj);
                    assert.isObject(err);
                    assert.equals(err, input1.systemError);
                    done();
                });
            });

        it('should not try to parse undefined', function() {
            mockedRunner.handleResult(undefined, function(err,
                dataObj) {
                assert(err);
                refute(dataObj);
            });
        });

    });
});

describe('Runner full tests', function() {
    var runner = require('../../lib/index.js');
    var os = require('os');

    it('should run with default config', function(done) {
        this.timeout(3000);
        var options = {
            'pageRunTime': 1,
            'outputDirectory': os.tmpDir()
        };
        var title = this.test.title;
        runner.run(options, function(err, result) {
            if (err) {
                console.log('\n' + title +' :TEST RUN ERROR:\n', err);
            }
            setTimeout(function() {
                refute(err);
                assert(result);
                result.har.failingUrls.forEach(function(entry){
                    assert.equals(entry, null, 'should not have failing url:'+ entry.url);
                });
                done();
            }, 0);
        });
    });

    it('should run with log instrumentation', function(done) {
        this.timeout(3000);
        var title = this.test.title;
        var options = {
            'instrument': ['log'],
            'preprocess': ['log'],
            'validate': ['log'],
            'pageRunTime': 25,
            'outputDirectory': os.tmpDir()
        };
        runner.run(options, function(err, result) {
            if (err) {
                console.log('\n' + title +' :TEST RUN ERROR:\n', err);
            }

            setTimeout(function() {
                refute(err);
                assert(result.log, 'expect log object');
                assert(result.log.logs,
                    'expected a log');
                done();
            }, 0);
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


    var http = require('http');
    var fs = require('fs');
    before(function(){
        this.__port = (process.env.PORT||7070);
        this.server = http.createServer(function(req, res){
            //console.log('req', req.headers);
            var filePath;
            if (req.url.indexOf('script3.js') > -1) {
                filePath = path.join(__dirname, '/fixtures/script3.js');
            } else if (req.url.indexOf('script2.js') > -1) {
                filePath = path.join(__dirname, '/fixtures/script2.js');
            } else {
                filePath = path.join(__dirname, '/fixtures/script1.js');
            }

            var stat = fs.statSync(filePath);

            res.writeHead(200, {
                'Content-Type': 'application/javascript',
                'Content-Length': stat.size
            });

            var readStream = fs.createReadStream(filePath);
            readStream.pipe(res);
            //console.log('send file', filePath);
        }).listen(this.__port, '127.0.0.1');
    });

    it('should run with action instrumentation', function(done) {
        this.timeout(6000);
        var options = {
            'config': {
                har: {
                    checkTls: false
                }
            },
            'instrument': [
                'actions',
                //'gardr',
                'har',
                'common',
                'log'
            ],
            'preprocess': [
                'har',
                'log'
            ],
            'validate': [
                'gardr',
                'common',
                'log'
            ],
            'pageRunTime': 3000,
            'scriptUrl': 'http://localhost:' + this.__port + '/script2.js?' + this.test.title,
            'outputDirectory': os.tmpDir()
        };

        //console.log(Object.keys(this.t est));
        runner.run(options, function(err, result) {
            if (err) {
                console.log('TEST RUN ERROR', err);
            }
            // unwind stack from runner
            setTimeout(function() {
                refute(err);

                result.har.failingUrls.forEach(function(entry){
                    assert.equals(entry, null, 'should not have failing url:'+ entry.url);
                });

                if (result.common.errors.length > 0 && result.common.errors[0]) {
                    console.log('logs:\n', result.log.logs.map(function(a){return a.message}).join('\n'));
                    console.log('userlogs:\n', result.log.userLogs.map(function(a){return a.message}).join('\n'));
                    console.log('res',  result.common.errors[0], result.common.errors[0].trace);
                }
                assert.equals(result.common.errors.length, 0, 'should not have errors');

                assert(result.actions);
                //console.log('result.actions', result.actions);
                //console.log('result.gardr', result);
                assert(result.log.logs, 'expected a log');
                assert(result.log.logs.length > 0, 'by default phantom main.js should emit logs');
                done();
            }, 0);
        });
    });

    [{
        name: '1',
        errors: 2
    },{
        name: '2',
        errors: 3
    }, {
        name: '3',
        errors: 0
    }].forEach(function(o){
        var index = o.name;
        it('should run with multiple instrumentations testrun ' + index, function(done) {
            this.timeout(6000);
            var options = {
                'config': {
                    har: {
                        checkTls: false
                    }
                },
                'instrument': [
                    'cookies',
                    'actions',
                    'gardr',
                    'screenshots',
                    'har',
                    'common',
                    'log', {
                        name: 'hooky',
                        path: HOOKY_PATH
                    }
                ],
                'preprocess': [
                    'har',
                    'log'
                ],
                'validate': [
                    'cookies',
                    'gsap',
                    'jquery',
                    'common',
                    'log'
                ],
                'pageRunTime': 2000,
                'scriptUrl': 'http://localhost:'+this.__port+'/script'+index+'.js?' + this.test.title,
                'outputDirectory': os.tmpDir()
            };
            runner.run(options, function(err, result, report) {
                if (err) {
                    console.log('TEST RUN ERROR', err);
                }
                // unwind stack from runner
                setTimeout(function() {
                    refute(err);

                    assert.equals(report.error.length, o.errors,
                        'should have ' + o.errors + ' errors: ' + JSON.stringify(report.error, null, 4));
                    report.error.forEach(function(errorEntry) {
                        assert(errorEntry.validatorName == 'log' ||
                            errorEntry.validatorName == 'gsap' ||
                            errorEntry.validatorName == 'jquery');
                    });

                    result.har.failingUrls.forEach(function(entry) {
                        assert.equals(entry, null, 'should not have failing url:'+ entry.url);
                    });

                    //console.log(report);
                    //console.log('result.cookies', result.cookies);
                    //console.log(result.actions);
                    //console.log(result.gardr);

                    // console.log('!-------');
                    // console.log(result.log.userLogs.map(function(a){
                    //     return a.message.replace('!internal ', '');
                    // }).join('\n'));
                    // console.log('-------|');

                    if (result.common.errors && result.common.errors.length > 0) {
                        console.error('errors:', result.common.errors);
                    }
                    assert.equals(result.common.errors.length, 0, 'should not have errors');
                    assert(result.screenshots, 'expected a screenshots data point');
                    assert(result.screenshots.onCustomEvent, 'expected to start');

                    //console.log('result.gardr.dom:\n', JSON.stringify(result.gardr, null, 4 ));
                    assert(result.gardr.dom);
                    assert.equals(result.gardr.dom.banner.id, 'banner' + index);

                    assert(result.log.logs, 'expected a log');
                    assert(result.log.logs.length > 0, 'by default phantom main.js should emit logs');
                    assert.equals(result.hooky.spooky, 'wooky', 'results should be namespaced');
                    done();
                }, 0);
            });
        });
    });


    after(function(done){
        this.server.close(done)
        this.server = null;
    });

});
