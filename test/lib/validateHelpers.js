var hoek = require('hoek');
var config = require('../../config/config.js');
var validate = require('../../lib/validate.js');

var internals = {};

internals.getTraceObject = function (name) {
    return {
        'name': name + '',
        'time': Date.now(),
        'trace': {
            sourceURL: 'http://dummyfile.js',
            line: '123'
        }
    };
};

internals.createReporter = function () {
    return validate.createReportHelper({})(this.test.title);
};

internals.applyType = function (type) {
    return function (name, harvest, reporter, cb, mutateFn) {
        if (!harvest) {
            throw new Error('Testhelper ' + name + ' needs a harvest object');
        }
        if (!reporter) {
            throw new Error('Testhelper ' + name + ' needs a reporter');
        }
        if (typeof cb !== 'function') {
            throw new Error('Testhelper ' + name + ' needs a done/callback function. Instead saw:' + (typeof cb));
        }
        var cloned = hoek.clone(config);
        var ctx = cloned.config[name];

        if (typeof mutateFn === 'function') {
            mutateFn(ctx, cloned);
        }
        var path = '../../lib/rule/' + type + '/' + name + '.js';
        return require(path)[type]
            .call(ctx, harvest, reporter, cb, cloned, ctx);
    };
};

module.exports = {
    'callValidator': internals.applyType('validate'),
    'callPreprocessor': internals.applyType('preprocess'),
    'getTraceObject': internals.getTraceObject,
    'createReporter': internals.createReporter,
    'config': config
};
