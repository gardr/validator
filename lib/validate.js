'use strict';
var async = require('async');
var path = require('path');

var KEYS = ['info', 'debug', 'warn', 'error'];

function createReportHelper(result) {
    return function entryReporter(validatorFileName) {
        var reportHelpers = {};

        KEYS.forEach(function (key) {
            result[key] = result[key] || [];
            reportHelpers[key] = function (message, data) {
                var res = {
                    'message': message,
                    'validatorFileName': validatorFileName,
                    'validatorName': path.basename(validatorFileName, '.js')
                };
                if (data) {
                    res.data = data;
                    if (res.data.trace && !Array.isArray(res.data.trace)) {
                        res.data.trace = [res.data.trace];
                    }

                    if (Array.isArray(res.data.trace)) {
                        var found = [];
                        res.data.trace = res.data.trace.filter(function (entry) {
                            var key = entry.file + entry.sourceURL + entry.line;
                            if (found.indexOf(key) > -1) {
                                return false;
                            }

                            entry.file = path.basename(entry.sourceURL).replace(/\?.*$/, '');
                            if (entry.file.length > 25) {
                                entry.file = entry.file.substring(0, 25);
                            }
                            found.push(key);

                            return true;

                        });
                    }
                }
                result[key].push(res);
            };
            reportHelpers.getResult = function () {
                return result;
            };
        });
        return reportHelpers;
    };
}

function isNotObject(o){
    var isObject = typeof o === 'object';
    return !isObject;
}

function deepFreeze(o) {
    var prop, propKey;
    if (typeof prop !== 'object'){
        return o;
    }
    Object.freeze(o);
    for (propKey in o) {
        prop = o[propKey];
        if (!o.hasOwnProperty(propKey) || isNotObject(prop) || Object.isFrozen(prop)) {
            continue;
        }
        deepFreeze(prop);
    }
    return o;
}

function filterDataByDependencies(harvested, dependencies, fileName) {
    var res = {
        'common': harvested.common
    };
    if (dependencies) {
        dependencies.forEach(function (name) {
            res[name] = harvested[name]||{};
            if (!harvested[name] && fileName !== 'test') {
                console.warn('Missing data from dependency ' + name + '. ' + fileName);
            }
        });
    }
    return Object.freeze(res);
}

function preprocess(harvested, options, callback){
    var files = options.preprocessorFiles;
    if (!files || !Array.isArray(files) || files.length === 0){
        return callback();
    }

    async.mapSeries(options.preprocessorFiles, function(fileName, done) {
        var mod;

        if (typeof fileName !== 'string') {
            mod = fileName;
        } else {
            mod = require(fileName);
        }

        if (!mod || !mod.preprocess) {
            return done();
        }

        mod.dependencies = mod.dependencies||[];

        var filtered = filterDataByDependencies(harvested, mod.dependencies, fileName);

        function outputter(context, key, value){
            if (typeof value === 'undefined' && context && key){
                value = key;
                key = context;
                context = mod.dependencies[0]||'common';
            }
            if (!filtered[context] || mod.dependencies.indexOf(context) === -1){
                throw new Error('You can only output on dependencies');
            }
            filtered[context][key] = value;
        }

        mod.preprocess(filtered, outputter, done, options);

    }, callback);
}

function validate(harvested, options, callback) {
    var resultData = {};
    var validators = options.validatorFiles;
    var entryReporter = createReportHelper(resultData);

    if (!Array.isArray(validators)) {
        throw new Error('Validators should be an list');
    }

    preprocess(harvested, options, function () {

        // make read-only
        deepFreeze(harvested);

        //console.log('INPUT TO VALIDATORS:', harvested);

        async.mapSeries(validators, function(fileName, done) {

            var mod;

            if (typeof fileName !== 'string') {
                mod = fileName;
            } else {
                mod = require(fileName);
            }

            if (!mod || !mod.validate) {
                return done();
            }

            var filtered = filterDataByDependencies(harvested, mod.dependencies, fileName);
            mod.validate(filtered, entryReporter(fileName), done, options);

        }, function validationDone(err) {
            callback(err, harvested, resultData, options);
        });
    });

}

module.exports = {
    validate: validate,
    filterDataByDependencies: filterDataByDependencies,
    createReportHelper: createReportHelper
};
