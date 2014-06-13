'use strict';
var hoek        = require('hoek');
var pathLib     = require('path');
var fs          = require('fs');
var helpers     = require('./helpers.js');
var validate    = require('./validate.js').validate;
var spawn       = require('./spawn.js');
var defaults    = require('../config/config.js');

var internals = {};

var validatorBase = pathLib.resolve(pathLib.join(__dirname, '..'));

internals.prepareOptions = function(options){
    if (options.hooks || options.preprocessors || options.validators){
        throw new Error('Deprecated keys');
    }
    // convert includes into validators
    if (options.include){
        if (options.validate){
            throw new Error('Include is a alias for validate, do not use both');
        }
        options.validate = options.include;
        delete options.include;
    }
};


internals.resolveIncludes = function(options){

    function hasDependency(dependencyName, type){
        return options[type].some(function(entry){
            return dependencyName && dependencyName === entry.name;
        });
    }

    function addDependency(dependencyName, type){
        type = typeof type === 'string' ? type : 'instrument';
        if (!options[type]){
            options[type] = [
                helpers.mapEntry(type)(dependencyName)
            ];
        } else if (hasDependency(dependencyName, type) !== true) {
            options[type].push(
                helpers.mapEntry(type)(dependencyName)
            );
        }
    }

    function readDependencies(entry){
        // console.log('readDependencies'.blue, entry.name);
        if (!entry.path){
            return;
        }
        try{
            var mod = require(entry.path);
            if (mod.dependencies){
                entry.dependencies = mod.dependencies;
                entry.dependencies.forEach(addDependency);
            }
            if (mod.preprocessors){
                entry.preprocessors = mod.preprocessors;
                entry.preprocessors.forEach(function(dependencyName){
                    addDependency(dependencyName, 'preprocess');
                });
            }
            // console.log('readDependencies()',entry.name,' result:'.blue, entry.dependencies && entry.dependencies.length);
        } catch(e){
            console.log('failed reading module '+entry.name, entry);
            throw e;
        }
    }

    // normalize
    helpers.collect(options);

    // resolve dependencies - starting with requiring all validators and preprocessors, and collecting dependencies.
    // todo: dependencies relative to same path? ./
    options.validate.forEach(readDependencies);
    options.preprocess.forEach(readDependencies);
};
internals.run = function (options, callback) {
    if (!callback){
        throw new Error('Missing callback');
    }
    if (!options){
        return callback(new Error('Missing options'));
    }
    
    internals.prepareOptions(options);

    options = hoek.applyToDefaults(defaults, options);

    internals.resolveIncludes(options);

    if (!options.instrument || options.instrument.length === 0) {
        return callback(new Error('Missing hooks/instrumentation from configuration'));
    }

    options.validatorBase = validatorBase;

    var byPath = function(o){return o.path;};
    helpers.statFiles(options.instrument.map(byPath), function (err) {
        if (err) {
            console.log('statFiles error', err);
            return callback(err, null);
        }

        // spawn phantomJS process
        spawn(options, internals.handleResult, function(processError, outputData){
            if (processError){
                console.log('Spawn error', processError);
                callback(processError);
            } else {
                if (outputData && outputData.path){
                    fs.readFile(outputData.path, function(err, harvestedData){
                        if (err){
                            return callback(err);
                        }

                        try{
                            harvestedData = JSON.parse(harvestedData);
                        }catch(e){
                            err = e;
                        }

                        if (err){
                            return  callback(err);
                        }

                        validate(harvestedData, options, callback);
                    });
                } else {
                    console.log('Missing output path from phantom / Output error:', outputData);
                    callback(new Error('Missing output path from phantom'));
                }
            }
        });
    });
};


// handle result from phantomJS process
internals.handleResult = function (jsonResult, callback, parentError) { //Todo logic around parentError.
    var result = null;
    var error = null;

    if (!callback) {
        throw new Error('Missing handleResult callback');
    }

    if ((typeof jsonResult === 'undefined' || jsonResult === undefined) && !parentError) {
        error = {
            message: 'PhantomJS shellout returned "undefined" ('+jsonResult+')',
            systemError: true
        };
    }

    var dataFound = false;

    if (!error) {

        var input = jsonResult.split('\n');

        // look for a line with json-data
        input.forEach(function(value){
            if (value && value.indexOf('{') === 0){
                try {
                    result = JSON.parse(value);

                } catch(e){
                    if (!parentError){
                        error = {
                            message: 'Error parsing phantomjs result',
                            systemError: true,
                            error: e
                        };
                    }
                }
                if (dataFound === false && result && result.path){
                    dataFound = true;
                }
            } else if (value){
                if (value.indexOf('SyntaxError') > -1){
                    // error = {
                    //     message: 'There occured a \"'+value+'\" inside phantomjs',
                    //     systemError: false
                    // }
                    console.log('Unhandled value:'+value);
                } else {
                    console.log('Unhandled value:', value);
                }

            }
        });

    }

    if (result && !error && result.systemError) {
        error = result.systemError !== true ? result.systemError : result;
        result = null;
    }

    if (!error && dataFound === false){
        error = {
            message: 'Error parsing phantomjs result, missing output path',
            systemError: true
        };
    }

    if (!error && parentError) {
        error = parentError;
    }

    callback(error, result);
};

module.exports = {
    'defaults': defaults,
    'handleResult': internals.handleResult,
    'run': internals.run
};
