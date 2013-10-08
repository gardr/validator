'use strict';
var spawn = require('./spawn.js');

var PHANTOM_RUNNER_BASE = './rule/hook';

function collectSpec(specObj) {
    return Object.keys(specObj).map(function (key) {
        return PHANTOM_RUNNER_BASE + key + '.js';
    });
}

function run(options, callback) {
    if (!options || !options.spec) {
        return callback(new Error('Missing spec'));
    }
    options.files = collectSpec(options.spec);
    if (!options.pageUrl) {
        return callback(new Error('Missing pageURl'));
    }
    //... BIN_PATH
    spawn(options, handleResult, callback);
}

function handleResult(jsonResult, callback) {
    var result = null,
        error = null;
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
    handleResult: handleResult,
    run: run
};
