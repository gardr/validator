var http = require('http');
var xstatic = require('node-static');
var hoek = require('hoek');

var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var help = require('../lib/validateHelpers.js');

var instrumentation = require('../../lib/rule/instrument/har.js');
var hooksApi = require('../../lib/phantom/hooksApi.js');

describe('HAR instrumentation hook', function () {

    it('should store calls on probedata', function () {

        var result = {};
        var api = hooksApi({}, {}, result, 'har');

        instrumentation.onLoadStarted();
        instrumentation.onResourceRequested({
            id: 1
        });
        instrumentation.onResourceReceived({
            id: 1,
            stage: 'start'
        });
        instrumentation.onResourceReceived({
            id: 1,
            stage: 'end'
        });
        instrumentation.onPageOpen();
        instrumentation.onBeforeExit(api);

        var res = result.har.input.resources;

        assert.equals(res.length, 1);
        assert(res[0].startReply);
        assert(res[0].endReply);
    });
});

function genReq(pre) {
        pre = pre || 'http://localhost:1234/';
        var counter = 0;
        return function getResource(offset, i) {
            i = i || counter++;
            var url = pre + i + '.js';
            return {
                'request': {
                    url: url,
                    time: new Date(Date.now() + offset)
                },
                'startReply': {
                    url: url,
                    time: new Date(Date.now() + offset)
                },
                'endReply': {
                    url: url,
                    time: new Date(Date.now() + offset + 1)
                }
            };
        };
    }

describe('HAR preprocessor', function () {
    it('should call createHar and output createHar result to report', function (done) {
        var harvested = {
            'har': {
                input: {
                    resources: [
                        genReq('file://internal.url.to.be.removed')(),
                        genReq()()
                    ],
                    startTime: null,
                    endTime: null
                }
            },
            'actions': {
                actionTime: Date.now()
            }
        };

        var outputFn = help.createOutputter('har', harvested);

        var mock = {
            '../../createHAR.js': function (options, _input) {
                return _input;
            },
            './processResources.js': function (harvested, outputFn, next) {
                next();
            }
        };

        var mutateDataFn = null;

        help.callPreprocessor('har', harvested, outputFn, function () {
            assert(harvested.har.file);
            assert.equals(1, harvested.har.file.resources.length, 'should filter out prefixed file://');
            done();
        }, mutateDataFn, mock);
    });

    afterEach(function () {
        if (this.server){
            this.server.close();
            this.server = null;
        }
    });

    it('should split before and after actionTime', function (done) {
        function getContent(){
            return [
                Math.random()* 1000,
                Math.random()* 1000,
                new Array(Math.round(Math.random()* 100)).join(',').split(',').join('random'),
                Math.random()* 1000,
                Math.random()* 1000
            ].join('');
        }
        this.server = http.createServer(function (req, res) {
            res.writeHead(200, {
                'Content-Type': 'application/javascript'
            });
            res.end(getContent());
        }).listen();

        var resources = [10, 1000, 2000, 3000, 5000].map(genReq('http://localhost:'+this.server.address().port +'/'));
        var harvested = {
            'har': {
                input: {
                    resources: resources,
                    startTime: new Date(Date.now() - 1000),
                    endTime: new Date(Date.now() + 2500)
                }
            },
            'actions': {
                actionTime: new Date(Date.now() + 1500)
            }
        };

        var outputFn = help.createOutputter('har', harvested);
        function mutateOptions(context, config){
            config.config.har.checkTls = false;
        }
        var mock = {};

        help.callPreprocessor('har', harvested, outputFn, function () {

            // console.log(harvested.har);

            assert(harvested.har.file, 'file should be outputted');
            // console.log('TEST harvested:', harvested.har);

            assert(harvested.har.file.log.entries, 'should have an filtered entries array');
            assert.equals(5, harvested.har.file.log.entries.length);

            [{
                data: harvested.har.all,
                len: 5
            },
            {
                data: harvested.har.banner,
                len: 2
            },
            {
                data: harvested.har.rest,
                len: 3
            }].forEach(function (data) {
                assert.equals(Object.keys(data.data.rawFileData).length, data.len);
                assert.equals(data.data.rawFileDataSummary.total.requests, data.len);
            });

            // assert(false, 'TEST_CASE_NOT_DONE');

            done();
        }, mutateOptions, mock);
    });



    function getServer() {
        var path = __dirname + '/fixtures/files';
        var file = new xstatic.Server(path);
        var fileGzip = new xstatic.Server(path, { 'gzip': true });

        var gzipRegExp = /gzip=true/i;
        var redirectsRegExp = /redirect=(\d+)/i;

        var server = http.createServer(function (request, response) {
            request.addListener('end', function () {
                //console.log('\nserving for test', request.url);
                if (redirectsRegExp.test(request.url)) {
                    var match = request.url.match(redirectsRegExp);
                    var counter = parseInt(match[1], 10);
                    var query = counter > 0 ? 'redirect=' + (counter - 1) : '';
                    var newUrl = request.url.replace(redirectsRegExp, query);

                    response.writeHead(302, { 'Location': newUrl});
                    response.end();
                } else if (gzipRegExp.test(request.url)) {
                    fileGzip.serve(request, response);
                } else {
                    file.serve(request, response);
                }

            }).resume();
        }).listen();
        return server;
    }

    it('should populate real sizes and collect contents', function (done) {

        this.server = getServer();
        var port = this.server.address().port;
        var host = 'http://localhost:' + port;

        function getInput() {
            var resources = ['/addyn.js?redirect=5&gzip=true', '/addyn.js?gzip=true', '/addyn.js', '/bg.jpg', '/logo.png'];
            return resources.map(function (url) {
                var entry = hoek.clone(require('./fixtures/raw.json'));
                url = host + url;
                entry.request.url = url;
                entry.startReply.url = url;
                entry.endReply.url = url;
                return entry;
            });
        }


        var harvested = {
            'har': {
                input: {
                    resources: getInput(),
                    startTime: null,
                    endTime: null
                }
            },
            'actions': {
                actionTime: Date.now()
            }
        };

        var outputFn = help.createOutputter('har', harvested);

        function mutateOptions(context, config){
            config.config.har.checkTls = false;
        }

        help.callPreprocessor('har', harvested, outputFn, runTests, mutateOptions);

        function runTests() {
            function get(key) {
                return harvested.har.all.rawFileData[host + key];
            }

            assert.isObject(harvested.har.input, 'input should be an object');

            var data = harvested.har.all;

            assert.isObject(data.rawFileData);
            assert.equals(Object.keys(data.rawFileData).length, 5);

            refute(get('/addyn.js').compressed);
            assert(get('/addyn.js?gzip=true').compressed, 'gzip is on, so compressed flag should be true');
            assert.equals(get('/addyn.js?redirect=5&gzip=true').redirects.length, 6);

            assert.isObject(data.rawFileDataSummary);

            var total = data.rawFileDataSummary.total;
            assert.isObject(total);
            assert.equals(total.redirects, 6);
            assert.equals(total.rawRequests, 5);
            assert.equals(total.requests, 11);
            assert.isNumber(total.size, 'size should be a number');
            assert.isNumber(total.fullSize, 'fullSize should be a number');

            var tips = data.rawFileDataSummary.tips;
            assert.isNumber(tips.possibleCompressTarget, 'possibleCompressTarget should be a number');
            assert.isNumber(tips.possibleCompressImprovement, 'possibleCompressImprovement should be a number');
            assert.isNumber(tips.possibleCompressWithOnlyScriptGzip,
                'possibleCompressWithOnlyScriptGzip should be a number');

            done();
        }
    });

    function tlsHelper(statusCode, done, mutateDataFn, resources) {
        resources = resources||[
            genReq('http://domain.com')(),
            genReq()()
        ];
        var harvested = {
            'har': {
                input: {
                    resources: resources,
                    startTime: null,
                    endTime: null
                }
            },
            'actions': {
                actionTime: Date.now()
            }
        };

        var outputFn = help.createOutputter('har', harvested);

        var proxyquire = require('proxyquire');
        var i = 0;
        var mock = {
            '../../createHAR.js': function (options, _input) {
                return _input;
            },
            './processResources.js': proxyquire('../../lib/rule/preprocess/processResources.js', {
                'request': function(url, options, cb){
                    if (url.indexOf('https') === 0){
                        i++;
                    }
                    cb(null, {statusCode: statusCode, request: {redirects: []}, headers: []}, 'dummy');
                }
            })
        };

        help.callPreprocessor('har', harvested, outputFn, function () {
            done(harvested, i);
        }, mutateDataFn, mock);
    }

    it('should report on tls requests', function (done) {
        tlsHelper(200, function(harvested, httpsMatches){
            assert.equals(httpsMatches, 2);
            assert.equals(harvested.har.validTls, true);
            assert.equals(harvested.har.failingUrls.length, 0);
            done();
        });
    });

    it('should report on failing tls requests', function (done) {
        tlsHelper(404, function(harvested, httpsMatches){
            assert.equals(httpsMatches, 2);
            assert.equals(harvested.har.validTls, false);
            assert.equals(harvested.har.failingUrls.length, 2);
            done();
        });
    });

    it('should not report if false checkTls', function (done) {
        tlsHelper(200, function(harvested, httpsMatches){
            assert.equals(httpsMatches, 0);
            assert.equals(harvested.har.validTls, undefined);
            assert.equals(harvested.har.failingUrls, undefined);
            done();
        }, function (context, config){
            config.config.har.checkTls = false;
        });
    });

    it('should not report if empty set', function(done){
        tlsHelper(200, function(harvested, httpsMatches){
            assert.equals(httpsMatches, 0);
            assert.equals(harvested.har.validTls, true);
            done();
        }, function (context, config){
            config.config.har.checkTls = true;
        }, []);
    });

});
