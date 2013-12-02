/* jshint: */
var createHAR = require('../../createHAR.js');

var version = require('../../../package.json').version;

/*
    request all external contents

    collect sizes, width and without GZIP

    "entries": [
          {
            "startedDateTime": "2013-12-02T09:34:02.260Z",
            "time": null,
            "request": {
              "method": "GET",
              "url": "http://helios.finn.no/addyn%7C3.0%7C989.1%7C4489198%7C0%7C16%7CADTECH;cfp=1;rndc=1385976829;cookie=info;loc=100;target=_blank;alias=car%2Fused%2Fsearch%2Flist_mm;grp=154176158;kvuserid=854203993;misc=414222659203370",
              "httpVersion": "HTTP/1.1",
              "cookies": [],
              "headers": [],
              "queryString": [],
              "headersSize": -1,
              "bodySize": -1
            },
            "response": {
              "status": 200,
              "statusText": "OK",
              "httpVersion": "HTTP/1.1",
              "cookies": [],
              "headers": [],
              "redirectURL": "",
              "headersSize": -1,
              "bodySize": 7508,
              "content": {
                "size": 7508,
                "mimeType": "application/x-javascript"
              }
            },
            "cache": {},
            "timings": {
              "blocked": 0,
              "dns": -1,
              "connect": -1,
              "send": 0,
              "wait": 76,
              "receive": 0,
              "ssl": -1
            },
            "pageref": "pasties-validator-phantomjs"
          }

    =>

    bodySize: 33,
    content: {
        "size": 33,
        "compression": 0,
        "mimeType": "text/html; charset=utf-8",
        "text": "\n",
        "encoding": "base64"
    }

*/
var async = require('async');
var request = require('request');
var zlib = require('zlib');
var hoek = require('hoek');

function getRealResources(harvested, report, nextValidator) {

    if (!harvested.HARFile.log){
        return nextValidator();
    }

    async.forEachSeries(harvested.HARFile.log.entries, iterator, doneHandler);

    harvested.rawFileData = {};

    function iterator(entry, next){
        /*
            1 Collect body size.
            2 Calculate gzip.
            3 Find out many redirects.
        */

        var options = {
            headers: {
                'Accept-Encoding': 'gzip,deflate',
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26     (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25'
            },
            'encoding': null

        };
        request(entry.request.url, options, function(err, response, body){

            if (err){
                console.log(err);
            }

            // phantom sizes are buggy at best.
            entry.response.bodySize = body.length;
            entry.response.content.size = body.length;

            var output = harvested.rawFileData[entry.request.url] = {
                redirects: response.request.redirects,
                contentType: response.headers['content-type'],
                contentLength: response.headers['content-length'],
                bodyLength: body.length,
                body: body
            };

            var gzipped = response.headers['content-encoding']||response.headers['Content-Encoding']
            output.compressed = !!gzipped;


            // find compressions
            zlib.gzip(body, function(err, buffer){
                var compressionPossible = body.length - buffer.length;

                if (gzipped){
                    entry.response.content.compression = compressionPossible;
                }

                output.compressionPossible = compressionPossible;
                output.compressedSize = buffer.length;


                next();
            });

        });

    }

    function doneHandler(err, result){

        var keys = Object.keys(harvested.rawFileData);
        var iterList = keys.map(function(key){
            return {key: key, value: harvested.rawFileData[key]};
        });

        function list(type, fn){
            return iterList[type](function(entry){
                return fn(entry.key, entry.value);
            });
        }

        function getRedirects(){
            var _list = list('filter', function(key, value){
                return value.redirects && value.redirects.length > 0;
            }).map(function(entry){
                return entry.value.redirects;
            });
            return hoek.flatten.apply(hoek.flatten, _list);
        }

        function getBodySize(){
            return list('map', function(key, value){
                return value.bodyLength;
            }).reduce(function(current, b){
                return current + b;
            }, 0);
        }

        function getCompressedBodySize(){
            return list('map', function(key, value){
                return value.compressed ? value.compressedSize : value.bodyLength;
            }).reduce(function(current, b){
                return current + b;
            }, 0);
        }

        function getTotalIfCompressed(){
            return list('map', function(key, value){
                return value.compressedSize;
            }).reduce(function(current, b){
                return current + b;
            }, 0);
        }

        var redirects = getRedirects();
        var bodySize = getBodySize();
        var compressedBodySize = getCompressedBodySize();
        var totalIfCompressed = getTotalIfCompressed();


        // summary
        harvested.rawFileDataSummary = {
            total: {
                redirects: redirects.length,
                rawRequests: keys.length,
                requests: keys.length + redirects.length,
                bodySize: bodySize,
                compressedBodySize: compressedBodySize,
            },
            tips: {
                possibleCompressTarget: totalIfCompressed,
                possibleCompressImprovement: compressedBodySize - totalIfCompressed
            }
        };

        nextValidator();
    }


}

module.exports = {
    getRealResources: getRealResources,
    validate: function (harvested, report, next) {

        function filterHttp(entry) {
            return entry.request.url.indexOf('http') === 0;
        }

        var input = harvested.harInput;

        var raw = {
            'resources': input.resources.filter(filterHttp),
            'startTime': input.startTime,
            'endTime':  input.endTime
        };

        harvested.HARFile = createHAR({
            title: 'phantom',
            address: 'pasties-validator-phantomjs',
            creator: {
                name: 'pasties-validator-phantomjs',
                version: version
            }
        }, raw);


        getRealResources(harvested, report, next);

    }
};
