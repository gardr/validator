'use strict';
var hoek        = require('hoek');
var pathLib     = require('path');
var helpers     = require('./helpers.js');
var validate    = require('./validate.js').validate;
var spawn       = require('./spawn.js');
var defaults    = require('../config/config.js');

var validatorBase = pathLib.resolve(pathLib.join(__dirname, '..'));

function run(options, callback) {
    if (!options || !options.hooks) {
        return callback(new Error('Missing spec'));
    }
    if (!callback){
        throw new Error('Missing callback');
    }

    options = hoek.applyToDefaults(defaults, options);

    options.validatorBase = validatorBase;

    options.hooks         = helpers.collectSpec(options.hooks);

    if (options.validators) {
        options.validatorFiles = helpers.collectValidator(options.validators);
    } else {
        options.validatorFiles = [];
    }

    if (options.preprocessors) {
        options.preprocessorFiles = helpers.collectPreprocessor(options.preprocessors);
    }

    helpers.statFiles(options.hooks, function (err) {
        if (err) {
            console.log('statFiles error', err);
            return callback(err, null);
        }

        // spawn phantomJS process
        spawn(options, handleResult, function(processError, harvestedData){
            if (processError){
                console.log('Spawn error', processError);
                callback(processError);
            } else {
                validate(harvestedData, options, callback);
            }
        });
    });
}


// handle result from phantomJS process
function handleResult(jsonResult, callback, parentError) { //Todo logic around parentError.
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

    if (!error) {
        try {
            result = JSON.parse(jsonResult);
        } catch (e) {
            if (!parentError){
                error = {
                    message: 'Error parsing phantomjs result',
                    systemError: true,
                    error: e
                };
            }
        }
    }

    if (result && !error && result.systemError) {
        error = result.systemError !== true ? result.systemError : result;
        result = null;
    }

    if (!error && parentError) {
        error = parentError;
    }

    callback(error, result);

}

module.exports = {
    handleResult: handleResult,
    run: run
};
