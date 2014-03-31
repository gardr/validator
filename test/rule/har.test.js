var http = require('http');
var xstatic = require('node-static');
var hoek = require('hoek');

var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var instrumentation = require('../../lib/rule/instrument/har.js');
var hooksApi = require('../../lib/phantom/hooksApi.js');

describe('HAR hook', function () {

    it('should store calls on probedata', function () {

        var result = {};
        var api = hooksApi({}, {}, result, 'har');

        instrumentation.onLoadStarted();
        instrumentation.onResourceRequested({id: 1});
        instrumentation.onResourceReceived({id: 1, stage: 'start'});
        instrumentation.onResourceReceived({id: 1, stage: 'end'});
        instrumentation.onPageOpen();
        instrumentation.onBeforeExit(api);

        var res = result.har.input.resources;

        assert.equals(res.length, 1);
        assert(res[0].startReply);
        assert(res[0].endReply);

    });

});

var proxyquire = require('proxyquire');

describe('HAR preprocessor', function () {

    var preprocessor = proxyquire('../../lib/rule/preprocess/har.js', {
        '../../createHAR.js': function (options, harInput) {
            return harInput;
        }
    });

    it('should call createHar and output to report', function (done) {

        var harvested = {
            har: {
                input: {
                    resources: [{request: {url: 'file://'}}],
                    startTime: null,
                    endTime: null
                }
            }
        };

        var outputFn = function(context, key, value){
            harvested[context] = harvested[context]||{};
            harvested[context][key] = value;
        };

        preprocessor.preprocess(harvested, outputFn, function () {
            assert(harvested.har.file);
            assert.equals(0, harvested.har.file.resources.length);
            done();
        }, {});
    });

    var server;
    before(function(){

        var path = __dirname + '/fixtures/files';
        var file = new xstatic.Server(path);
        var fileGzip = new xstatic.Server(path,{ gzip: true });

        var gzipRegExp = /gzip=true/i;
        var redirectsRegExp = /redirect=(\d+)/i;

        server = http.createServer(function (request, response) {
            request.addListener('end', function () {
                //console.log('\nserving for test', request.url);
                if (redirectsRegExp.test(request.url)){
                    var match = request.url.match(redirectsRegExp);
                    var counter = parseInt(match[1], 10);
                    var query = counter > 0 ? 'redirect='+(counter-1) : '';
                    var newUrl = request.url.replace(redirectsRegExp, query);

                    response.writeHead(302, { 'Location': newUrl });
                    response.end();
                }
                else if (gzipRegExp.test(request.url)){
                    fileGzip.serve(request, response);
                }
                else {
                    file.serve(request, response);
                }


            }).resume();
        }).listen();
    });


    //var HARFile = require('./fixtures/HARFile.json');
    var rawResource = require('./fixtures/raw.json');
    function getInput(){
        var host = 'http://localhost:'+server.address().port;

        var resources = ['/addyn.js?redirect=5&gzip=true', '/addyn.js?gzip=true', '/addyn.js', '/bg.jpg', '/logo.png'];

        return resources.map(function(url){
            var entry = hoek.clone(rawResource);
            url = host+url;
            entry.request.url = url;
            entry.startReply.url = url;
            entry.endReply.url = url;
            return entry;
        });
    }

    var processResources = require('../../lib/rule/preprocess/processResources.js');

    it('should populate real sizes and collect contents', function(done){
        var harvested = {
            har: {
                input: {
                    resources: getInput()
                }
            }
        };

        var outputFn = function(context, key, value){
            harvested[context] = harvested[context]||{};
            harvested[context][key] = value;
        };

        var host = 'http://localhost:'+server.address().port;
        function get(key){
            return harvested.har.rawFileData[host+key];
        }

        processResources(harvested, outputFn, function(){

            var data = harvested.har;

            assert.isObject(data.input);

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
            assert.isNumber(tips.possibleCompressTarget,     'possibleCompressTarget should be a number');
            assert.isNumber(tips.possibleCompressImprovement,'possibleCompressImprovement should be a number');
            assert.isNumber(tips.possibleCompressWithOnlyScriptGzip,
                'possibleCompressWithOnlyScriptGzip should be a number');

            done();
        }, {});
    });


    after(function(){
        server.close();
        server = null;
    });
});
