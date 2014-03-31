var fs = require('fs');
var pathLib = require('path');
var async = require('async');

var internals = {};

internals.mapEntry = function (type) {
    return function (entry) {
        if (typeof entry === 'object') {
            // maybe validate???
            return entry;
        }

        if (typeof entry === 'string') {
            return {
                'name': entry,
                'path': pathLib.join(__dirname, '.', 'rule', type, entry + '.js')
            };
        } else {
            throw new Error('Wrong configuration of includes');
        }
    };
};

internals.collect = function (type) {
    return function (specList) {
        if (!Array.isArray(specList)){
            console.log('specList'.red, specList);
            throw new TypeError('Should send in a list');
        }
        return specList.map(internals.mapEntry(type));
    };
};

internals.statFiles = function (list, done) {
    return async.map(list, fs.stat, done);
};

module.exports = {
    'mapEntry': internals.mapEntry,
    'collect': function (parent) {
        parent.instrument = internals.collect('instrument')(parent.instrument);
        parent.preprocess = internals.collect('preprocess')(parent.preprocess);
        parent.validate = internals.collect('validate')(parent.validate);
    },
    'collectSpec': internals.collect('instrument'),
    'collectValidator': internals.collect('validate'),
    'collectPreprocessor': internals.collect('preprocess'),
    'statFiles': internals.statFiles
};
