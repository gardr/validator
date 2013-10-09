'use strict';
var path = require('path');
var fs = require('fs');
var async = require('async');
var spawn = require('./spawn.js');

var RULE_RUNNER_BASE    = path.join('..', 'rule');
var HOOK_BASE           = path.join(RULE_RUNNER_BASE, 'hook');
var VALIDATOR_BASE      = path.join(RULE_RUNNER_BASE, 'validator');

function collectSpec(specObj) {
    return Object.keys(specObj).map(function (key) {
        return path.join(HOOK_BASE, key + '.js');
    });
}

function collectValidator(specObj){
    return Object.keys(specObj).map(function(key){
        return path.join(VALIDATOR_BASE, key + '.js');
    });
}

function statFiles(list, done){
    return async.map(list, fs.stat, done);
}

function run(options, callback) {
    if (!options || !options.spec) {
        return callback(new Error('Missing spec'));
    }
    if (!options.pageUrl) {
        return callback(new Error('Missing pageURl'));
    }
    options.files = collectSpec(options.spec);

    statFiles(options.files, function(err){
        if (err){
            return callback(err, null);
        }
        spawn(options, handleResult, callback);
    });


}

function handleResult(jsonResult, callback) {
    var result = null;
    var error = null;

    try {
        result = JSON.parse(jsonResult);
    } catch (e) {
        error = e;
    }
    if (result && result.systemError) {
        error = result.systemError;
        result = null;
    }
    callback(error, result);
}

module.exports = {
    collectSpec: collectSpec,
    collectValidator: collectValidator,
    statFiles: statFiles,
    handleResult: handleResult,
    run: run
};
