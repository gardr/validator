var async = require('async');
var request = require('request');
var zlib = require('zlib');
var hoek = require('hoek');

var internals = {};

internals.each = function (rawFileData, fn) {
    var keys = Object.keys(rawFileData);
    var iterList = keys.map(function (key) {
        return {
            key: key,
            value: rawFileData[key]
        };
    });

    function list(type, fn) {
        return iterList[type](function (entry) {
            return fn(entry.key, entry.value);
        });
    }

    if (fn) {
        return list('forEach', fn);
    }

    return list;
};

internals.getSummary = function (rawFileData) {

    var list = internals.each(rawFileData);

    function getRedirects() {
        var _list = list('filter', function (key, value) {
            return value.redirects && value.redirects.length > 0;
        }).map(function (entry) {
            return entry.value.redirects||[];
        });
        return _list.length > 0 ? hoek.flatten.apply(hoek.flatten, _list) : _list;
    }

    function countErrors(){
        return list('filter', function (key, value) {
            return value.requestError;
        }).length;
    }

    function sum(_key) {
        return list('map', function (key, value) {
            return value[_key] * 1;
        }).reduce(function (current, b) {
            return current + (b*1||0);
        }, 0);
    }

    function getPossibleCompressWithScriptGzip() {
        return list('map', function (key, value) {
            return (value.contentType &&
                value.contentType.indexOf('javascript') > -1 ? value.aproxCompressedSize :
                value.unzippedSize
            );
        }).reduce(function (current, b) {
            return current + (b*1||0);
        }, 0);
    }

    var requests = Object.keys(rawFileData).length;
    var redirects = getRedirects();
    var fullSize = sum('unzippedSize');
    var totalIfCompressed = sum('aproxCompressedSize');

    // summary
    var total = {
        redirects: redirects.length,
        rawRequests: requests,
        requestErrors: countErrors(),
        requests: requests + redirects.length,
        size: sum('bodyLength'),
        fullSize: fullSize
    };

    var tips = {
        possibleCompressTarget: totalIfCompressed,
        possibleCompressImprovement: fullSize - totalIfCompressed,
        possibleCompressWithOnlyScriptGzip: getPossibleCompressWithScriptGzip()
    };

    return {
        'total': total,
        'tips': tips
    };
};

internals.getTypeSummary = function (rawFileData) {
    var types = {
        'script': {},
        'style': {},
        'image': {},
        'other': {},
        'errors': {}
    };

    function getType(value) {
        var t = value.contentType;
        return (
            value.requestError ? 'errors' :
            !t ? 'other' :
            t.indexOf('script') > -1 ? 'script' :
            t.indexOf('css') > -1 ? 'style' :
            t.indexOf('image') > -1 ? 'image' :
            'other'
        );
    }

    internals.each(rawFileData, function (key, value) {
        types[getType(value)][key] = value;
    });

    var summary = {};

    internals.each(types, function (key, value) {
        summary[key] = internals.getSummary(value);
    });

    return {
        'types': types,
        'summary': summary
    };
};
/*

    "entries": [
          {
            ...
            "response": {
              "bodySize": 7508,
              "content": {
                "size": 7508,
                "mimeType": "application/x-javascript"
              }
            }
            ...
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

module.exports = function (harvested, outputFn, nextValidator, options) {

    if (!harvested.har.input) {
        console.log('Missing har.input form harvested data, skipping resources');
        return nextValidator();
    }

    var rawFileData = {};

    var requestOptions = {
        headers: {
            'Accept-Encoding': 'gzip',
            'User-Agent': options.userAgent
        },
        'encoding': null
    };

    var requestOptionsWithoutGzip = {
        headers: {
            'User-Agent': options.userAgent
        },
        'encoding': null
    };

    /*
        1 Collect body size.
        2 Calculate gzip.
        3 Find out many redirects.
    */

    function iterator(entry, next) {

        var url = entry.request.url;

        var startsWithHttp = url.indexOf('http') === 0;
        if (startsWithHttp !== true){
            return next();
        }

        var responseCounter = 2;
        var output = {
            url: url
        };

        request(url, requestOptions, gzipHandler);
        request(url, requestOptionsWithoutGzip, rawHandler);

        var errorFound;
        function done(err) {
            if (err){
                errorFound = err;
                if (errorFound){
                    output.requestError = true;
                    output.error = err;
                }
            }
            responseCounter--;
            if (responseCounter <= 0) {
                rawFileData[url] = output;
                next();
            }
        }

        function rawHandler(err, res, body) {

            if (err || !body){
                return done(err);
            }

            output.base64Content = body.toString('base64');
            output.unzippedSize = body.length;

            // find compression target
            zlib.gzip(body, function (err, buffer) {
                var compressionPossible = body.length - buffer.length;

                //entry.response.content.compression = compressionPossible;
                output.aproxCompressionPossible = compressionPossible;
                output.aproxCompressedSize = buffer.length;

                done();
            });

        }

        function gzipHandler(err, res, body) {
            if (err || !body){
                return done(err);
            }
            // HAr correction phantom sizes are buggy at best.
            // entry.response.bodySize = body.length;
            // entry.response.content.size = body.length;

            output.redirects = res.request.redirects;
            output.contentType = res.headers['content-type'];
            output.contentLength = res.headers['content-length'];
            output.bodyLength = body.length;

            var encoding = res.headers['content-encoding'];
            output.compressed = !! (encoding && (/gzip/i).test(encoding));

            done();
        }

    }

    function doneHandler() {

        // output
        var rawFileDataSummary = internals.getSummary(rawFileData);
        rawFileDataSummary.typed = internals.getTypeSummary(rawFileData);

        outputFn('har', 'rawFileData', rawFileData);
        outputFn('har', 'rawFileDataSummary', rawFileDataSummary);


        nextValidator();
    }


    async.forEachSeries(harvested.har.input.resources, iterator, doneHandler);
};
