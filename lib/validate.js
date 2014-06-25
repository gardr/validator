'use strict';
var async = require('async');
var path = require('path');
var deepFreeze = require('deep-freeze');

var internals = {};

var RE_LAST_URL_SECTION = /([^\/]+)\/?$/i;
var RE_QUERY = /\?.*$/;

internals.formatTraceData = function (output, data){
    if (data) {
        // as validators may deal with protected/freezed data, lets copy out input.
        output.data = JSON.parse(JSON.stringify(data));
        if (output.data.trace && !Array.isArray(output.data.trace)) {
            output.data.trace = [output.data.trace];
        }

        if (output.data && Array.isArray(output.data.trace)) {
            var found = [];
            output.data.trace = output.data.trace.filter(function (entry) {
                var key = entry.file + entry.sourceURL + entry.line;

                if (found.indexOf(key) === -1) {

                    found.push(key);

                    entry.file = path.basename(entry.sourceURL).replace(/\?.*$/, '');
                    if (entry.file.length > 25) {
                        entry.file = entry.file.substring(0, 25);
                    }

                    if (!entry.file && entry.sourceURL){
                        var match = entry.sourceURL.replace(RE_QUERY, '').match(RE_LAST_URL_SECTION);
                        if (match && match[1]){
                            entry.file = match[1];
                        }

                        if (!entry.file){
                            entry.file = path.dirname(entry.sourceURL);
                        }
                    }
                    return true;
                }
                return false;
            });
        }
    }
    return output;
};

internals.REPORT_KEYS = ['info', 'debug', 'warn', 'error', 'success', 'meta'];
internals.createReportHelper = function (result, onCall) {
    result.checklist = result.checklist || [];
    internals.REPORT_KEYS.forEach(function (key) {
        result[key] = result[key] || [];
    });
    return function entryReporter(validatorFileName) {
        var reportHelpers = {};
        var activeChecklist;

        internals.REPORT_KEYS.forEach(function (key) {
            reportHelpers[key] = function (message, data) {
                var entry = internals.formatTraceData({
                    'type': key,
                    'message': message,
                    'time': Date.now(),
                    'isInChecklist': !!activeChecklist,
                    'checklistName': activeChecklist && activeChecklist.name,
                    'validatorFileName': validatorFileName,
                    'validatorName': path.basename(validatorFileName, '.js')
                }, data);

                if (typeof onCall === 'function'){
                    onCall(entry);
                }

                result[key].push(entry);

                if (activeChecklist){
                    activeChecklist[key].push(entry);
                }
                return entry;
            };
        });

        reportHelpers.setChecklist = function (name, desc) {
            var entry;

            result.checklist.forEach(function(e){
                if (e && e.name && e.name === name){
                    entry = e;
                }
            });

            if (!entry){
                entry = {
                    'name': name,
                    'time': Date.now(),
                    'desc': desc
                };
                internals.REPORT_KEYS.forEach(function (key) {
                    entry[key] = [];
                });
                result.checklist.push(entry);
            }

            activeChecklist = entry;

            return activeChecklist;
        };

        reportHelpers.exitChecklist = function(){
            activeChecklist = null;
        };

        reportHelpers.getResult = function () {
            return result;
        };
        return reportHelpers;
    };
};

internals.filterDataByDependencies = function (harvested, dependencies, fileName, dontFreeze) {
    var res = {
        'common': harvested.common
    };
    if (dependencies) {
        dependencies.forEach(function (name) {
            res[name] = harvested[name] || {};
            if (!harvested[name] && fileName !== 'test') {
                console.warn('Missing data from dependency \"' + name + '\". ' + fileName);
            }
        });
    }
    return dontFreeze ? res : Object.freeze(res);
};

internals.preprocess = function (harvested, options, callback) {
    var files = options.preprocess;

    if (!files || !Array.isArray(files) || files.length === 0) {
        return callback();
    }
    async.mapSeries(files, function (entry, done) {
        var mod;
        var fileName;
        if (typeof entry === 'object') {
            if (entry.path){
                fileName = entry.path;
                mod = require(fileName);
            } else {
                mod = entry;
                fileName = mod.name;
            }

        } else {
            mod = require(entry);
            fileName = entry;
        }

        if (!mod || !mod.preprocess) {
            console.log('missing', mod.name);
            return done();
        }

        mod.dependencies = mod.dependencies || [];

        var filtered = internals.filterDataByDependencies(harvested, mod.dependencies, fileName, true);

        if (mod.output && !filtered[mod.output]){
            harvested[mod.output] = filtered[mod.output] = {};
        }

        function outputter(context, key, value) {
            if (typeof value === 'undefined') {
                value = key;
                key   = context;
                context = (mod.output || mod.dependencies[0] || 'common');
            }
            if (!context){
                context = mod.output;
            }

            if (!filtered[context] || context !== mod.output && mod.dependencies.indexOf(context) === -1) {
                throw new Error('Preprocess output error: You can only output on dependencies or specify output prop. ---> \"'+ context+'\"');
            }
            filtered[context][key] = value;
        }

        var current  = path.basename(fileName, '.js');
        try{
            mod.preprocess.call(options.config[current], filtered, outputter, done, options, options.config[current]);
        } catch(e){
            if (process.env.NODE_ENV !== 'test'){
                console.log('Preprocess fn failed on _\"'+current+'\"_', e.message/*, e.stack*/);
            }
            done(e);
        }

    }, callback);
};

internals.validate = function (harvested, options, callback) {
    var resultData = {};
    var validators = options.validate;
    var entryReporter = internals.createReportHelper(resultData);

    if (!Array.isArray(validators)) {
        throw new Error('Validate property / validators should be an list');
    }
    internals.preprocess(harvested, options, function (err) {
        if (err){
            return callback(err);
        }
        // make read-only
        deepFreeze(harvested);

        async.mapSeries(validators, function (entry, done) {
            var mod, fileName;

            if (typeof entry === 'object') {
                if (entry.path){
                    fileName = entry.path;
                } else if (entry.code) {
                    // ? code prop
                } else {
                    mod = entry;
                }
            } else {
                fileName = entry;
            }
            if (!mod){
                try{
                    mod = require(fileName);
                }catch(e){
                    // if (process.env.NODE_ENV === 'test'){
                    //     throw e;
                    // }
                    return done(new Error('Error loading validation module '+fileName));
                }
            }

            if (!mod || !mod.validate) {
                return done(new Error('Missing validation method on module '+fileName));
            }

            var current  = path.basename(fileName, '.js');
            var inject = mod.dependencies.concat(mod.preprocessors).filter(Boolean);
            var filtered = internals.filterDataByDependencies(harvested, inject, fileName);
            try{
                mod.validate.call(
                    options.config[current], filtered, entryReporter(fileName), done, options, options.config[current]
                );
            } catch(e){
                console.log('Validation fn failed on \"'+current+'\"', e.message/*, e.stack*/);
                if (process.env.NODE_ENV === 'test'){
                    throw e;
                }
                done(e);
            }

        }, function validationDone(err) {
            if (err){
                //console.log('validationDone error via ', err.message, err.stack+'');
            }
            callback(err, harvested, resultData, options);
        });
    });
};

module.exports = {
    'REPORT_KEYS': internals.REPORT_KEYS,
    'validate': internals.validate,
    'filterDataByDependencies': internals.filterDataByDependencies,
    'createReportHelper': internals.createReportHelper,
    'deepFreeze': deepFreeze
};
