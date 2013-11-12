'use strict';
var helpers     = require('./helpers.js');
var validate    = require('./validate.js').validate;
var spawn       = require('./spawn.js');

function run(options, callback) {
    if (!options || !options.hooks) {
        return callback(new Error('Missing spec'));
    }

    options.hooks = helpers.collectSpec(options.hooks);

    if (options.validators) {
        options.validatorFiles = helpers.collectValidator(options.validators);
    } else {
        options.validatorFiles = helpers.collectValidator(options.hooks).map(function (file) {
            return file.replace(/\/hook\//, '/validator/');
        });
    }

    helpers.statFiles(options.hooks, function (err) {
        if (err) {
            return callback(err, null);
        }
        // spawn phantomJS process
        // console.log('\nrun', options);
        spawn(options, handleResult, function(processError, harvestedData){
            if (processError){
                callback(processError);
            } else {
                validate(harvestedData, options.validatorFiles, callback);
            }
        });
    });
}


// handle result from phantomJS process
function handleResult(jsonResult, callback) {
    var result = null;
    var error = null;

    if (!callback) {
        throw new Error('Missing handleResult callback');
    }

    if (typeof jsonResult === 'undefined' || jsonResult === undefined) {
        error = {
            message: 'PhantomJS shellout returned "undefined" ('+jsonResult+')',
            systemError: true
        };
    }

    if (!error) {
        try {
            result = JSON.parse(jsonResult);
        } catch (e) {
            error = {
                message: 'Error parsing phantomjs result',
                systemError: true,
                error: e
            };
        }
    }

    if (result && result.systemError) {
        error = result.systemError;
        result = null;
    }
    callback(error, result);
}

module.exports = {
    handleResult: handleResult,
    run: run
};
