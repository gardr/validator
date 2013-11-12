var path = require('path');
var fs = require('fs');
var async = require('async');

var RULE_RUNNER_BASE = path.join(__dirname, '.', 'rule');
var HOOK_BASE = path.join(RULE_RUNNER_BASE, 'hook');
var VALIDATOR_BASE = path.join(RULE_RUNNER_BASE, 'validator');

function collect(base){
    return function(spec){
        return Object.keys(spec).map(function (key) {
            var res;
            if (typeof spec[key] === 'string') {
                res = spec[key];
            } else {
                res = path.join(base, key + '.js');
            }
            return res;
        });
    };
}

var collectSpec      = collect(HOOK_BASE);
var collectValidator = collect(VALIDATOR_BASE);

function statFiles(list, done) {
    return async.map(list, fs.stat, done);
}

module.exports = {
    collectSpec: collectSpec,
    collectValidator: collectValidator,
    statFiles: statFiles
};
