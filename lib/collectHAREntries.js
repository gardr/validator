var async = require('async');
var request = require('request');
var zlib = require('zlib');
var hoek = require('hoek');

function each(rawFileData, fn) {
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
}

function getSummary(rawFileData) {

    var list = each(rawFileData);

    function getRedirects() {
        var _list = list('filter', function (key, value) {
            return value.redirects && value.redirects.length > 0;
        }).map(function (entry) {
            return entry.value.redirects;
        });
        return _list.length > 0 ? hoek.flatten.apply(hoek.flatten, _list) : _list;
    }

    function sum(_key) {
        return list('map', function (key, value) {
            return value[_key] * 1;
        }).reduce(function (current, b) {
            return current + b;
        }, 0);
    }

    function getPossibleCompressWithScriptGzip() {
        return list('map', function (key, value) {
            return (value.contentType &&
                value.contentType.indexOf('javascript') > -1 ? value.aproxCompressedSize :
                value.unzippedSize
            );
        }).reduce(function (current, b) {
            return current + b;
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
        total: total,
        tips: tips
    };
}

function getTypeSummary(rawFileData) {
    var types = {
        'script': {},
        'style': {},
        'image': {},
        'other': {}
    };

    function getType(t) {
        return (
            t.indexOf('script') > -1 ? 'script' :
            t.indexOf('css') > -1 ? 'style' :
            t.indexOf('image') > -1 ? 'image' :
            'other'
        );
    }

    each(rawFileData, function (key, value) {
        types[getType(value.contentType)][key] = value;
    });

    var summary = {};

    each(types, function (key, value) {
        summary[key] = getSummary(value);
    });

    return {
        types: types,
        summary: summary
    };
}
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

var userAgent = 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26     (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25';
module.exports = function (harvested, report, nextValidator) {

    if (harvested.HARFile && !harvested.HARFile.log) {
        return nextValidator();
    }

    async.forEachSeries(harvested.HARFile.log.entries, iterator, doneHandler);

    harvested.rawFileData = {};
    harvested.rawFileDataSummary = {};

    var requestOptions = {
        headers: {
            'Accept-Encoding': 'gzip',
            'User-Agent': userAgent
        },
        'encoding': null
    };

    var requestOptionsWithoutGzip = {
        headers: {
            'User-Agent': userAgent
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
        var responseCounter = 2;
        var output = {
            url: url
        };

        request(url, requestOptions, gzipHandler);
        request(url, requestOptionsWithoutGzip, rawHandler);

        function done() {
            responseCounter--;
            if (responseCounter <= 0) {
                harvested.rawFileData[url] = output;
                next();
            }
        }

        function rawHandler(err, res, body) {

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
            // phantom sizes are buggy at best.
            entry.response.bodySize = body.length;
            entry.response.content.size = body.length;

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
        harvested.rawFileDataSummary = getSummary(harvested.rawFileData);
        harvested.rawFileDataSummary.typed = getTypeSummary(harvested.rawFileData);

        nextValidator();
    }
};