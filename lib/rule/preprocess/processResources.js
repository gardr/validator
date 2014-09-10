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

module.exports = function (harvested, outputFn, next, options) {
    if (!harvested.har.input) {
        console.log('Missing har.input form harvested data, skipping resources');
        return next();
    }

    var rawFileData = {};

    var requestOptions = {
        'headers': {
            'Accept-Encoding': 'gzip',
            'User-Agent': options.userAgent
        },
        'encoding': null
    };

    var requestOptionsWithoutGzip = {
        'headers': {
            'User-Agent': options.userAgent
        },
        'encoding': null
    };

    var harConfig = this;

    /*
        1 Collect body size.
        2 Calculate gzip.
        3 Find out many redirects.
        4 Tag request error
    */
    function iterator(entry, nextIterator) {

        var url = entry.request.url;

        // filter out internals
        var isExternalContent = url.indexOf('http') === 0 &&
            url.indexOf(options.resourceDomainBase) !== 0 &&
            url.indexOf('es5-shim.min.js') < 0;

        if (isExternalContent !== true){
            return nextIterator();
        }

        var responseCounter = 2;
        var output = {
            'time': entry.request.time,
            'url': url
        };

        if (harConfig.checkTls) {
            responseCounter += 1;
            request(url.replace(/^http:/i,'https:'), requestOptions, tlsHandler);
        }


        request(url, requestOptions, gzipHandler);
        request(url, requestOptionsWithoutGzip, rawHandler);

        function done(err) {
            if (err){
                // errors here might come from gzip or raw handler -
                output.requestError = true;
                output.error = err;
            }

            responseCounter--;
            if (responseCounter <= 0) {
                rawFileData[url] = output;
                nextIterator();
            }
        }

        function tlsHandler(err, res) {
            if (err){
                output.validTls = false;
                output.tlsErrorMessage = err.message;
                output.tlsResponseCode = res && res.statusCode;
                return done();
            }

            output.validTls = !(res && res.statusCode >= 400);
            output.tlsResponseCode = res.statusCode;

            done();
        }

        function rawHandler(err, res, body) {

            if (err || !body){
                return done(err);
            }

            if (res && res.statusCode >= 400){
                return done(new Error('Request error'));
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

            if (res && res.statusCode >= 400){
                return done(new Error('Request error'));
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

    function set(key, rawFileData){
        outputFn('har', key+'.rawFileData', rawFileData);

        var rawFileDataSummary   = internals.getSummary(rawFileData);
        rawFileDataSummary.typed = internals.getTypeSummary(rawFileData);
        outputFn('har', key+'.rawFileDataSummary', rawFileDataSummary);
    }

    function filterObject(rawFileData, fn){
        var result = {};
        Object.keys(rawFileData).map(function(key){
            return rawFileData[key];
        }).filter(fn).forEach(function(o){
            result[o.url] = o;
        });
        return result;
    }

    function hasValidTls(){
        var keys = Object.keys(rawFileData);

        return keys.filter(function(key){
            return !rawFileData[key].validTls;
        }).length === 0;
    }

    function getFailingUrls(){
        return Object.keys(rawFileData).filter(function(key){
            return !rawFileData[key].validTls;
        }).map(function(key){
            return {
                'url': key,
                'errorMessage': rawFileData[key].tlsErrorMessage,
                'responseCode': rawFileData[key].tlsResponseCode
            };
        });
    }


    function processCheckTls() {
        outputFn('validTls', hasValidTls());
        outputFn('failingUrls', getFailingUrls());
    }

    async.forEachSeries(harvested.har.input.resources, iterator, function() {

        if (harConfig.checkTls) {
            processCheckTls();
        }

        set('all', rawFileData);

        var date = new Date(harvested.actions.actionTime);

        set('banner', filterObject(rawFileData, function(entry){
            return date > new Date(entry.time);
        }));

        set('rest', filterObject(rawFileData, function(entry){
            return date < new Date(entry.time);
        }));

        next();
    });
};
