var http = require('http');
var xstatic = require('node-static');
var hoek = require('hoek');

var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var hook = require('../../lib/rule/hook/har.js');

describe('HAR hook', function () {

    it('should store calls on probedata', function () {

        var result = {};
        var api = {
            getResultObject: function(){
                return result;
            }
        };

        hook.onLoadStarted();
        hook.onResourceRequested({id: 1});
        hook.onResourceReceived({id: 1, stage: 'start'});
        hook.onResourceReceived({id: 1, stage: 'end'});
        hook.onPageOpen();
        hook.onBeforeExit(api);

        var res = result.harInput.resources;

        assert.equals(res.length, 1);
        assert(res[0].startReply);
        assert(res[0].endReply);

    });

});

var proxyquire = require('proxyquire');
var HARFile = require('./fixtures/HARFile.json');




describe('HAR validator', function () {

    var validator = proxyquire('../../lib/rule/validator/har.js', {
        '../../createHAR.js': function (options, harInput) {
            return harInput;
        }
    });

    it('should call createHar and output to report', function (done) {

        var harvested = {
            harInput: {
                resources: [],
                startTime: null,
                endTime: null
            }
        };

        validator.validate(harvested, null, function () {
            assert(harvested.HARFile);
            assert.equals(0, harvested.harInput.resources.length);
            done();
        });
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

    function getHARfile(){
        var har = hoek.clone(HARFile);
        var host = 'http://localhost:'+server.address().port;

        har.log.entries.forEach(function(entry){
            entry.request.url = host + entry.request.url ;
        });

        return har;
    }

    it('should populate real sizes and collect contents', function(done){
        var harvested = {
            HARFile: getHARfile()
        };

        var host = 'http://localhost:'+server.address().port;
        function get(key){
            return harvested.rawFileData[host+key];
        }

        validator.getRealResources(harvested, null, function(){

            assert.isObject(harvested.HARFile);

            assert.isObject(harvested.rawFileData);
            assert.equals(Object.keys(harvested.rawFileData).length, 5);

            refute(get('/addyn.js').compressed);
            assert(get('/addyn.js?gzip=true').compressed, 'gzip is on, so compressed flag should be true');
            assert.equals(get('/addyn.js?redirect=5&gzip=true').redirects.length, 6);

            assert.isObject(harvested.rawFileDataSummary);
            assert.equals(harvested.rawFileDataSummary.total.redirects, 6);
            assert.equals(harvested.rawFileDataSummary.total.rawRequests, 5);
            assert.equals(harvested.rawFileDataSummary.total.requests, 11);

            //console.log(harvested.rawFileDataSummary)

            done();
        });
    });


    after(function(){
        server.close();
        server = null;
    });
});
