var hoek = require('hoek');
var proxyquire = require('proxyquire').noPreserveCache();
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
    return function (name, harvest, reporter, callback, mutateDataFn, proxyquireInject) {
        if (!harvest) {
            throw new Error('Testhelper ' + name + ' needs a harvest object');
        }
        if (!reporter) {
            throw new Error('Testhelper ' + name + ' needs a reporter');
        }
        if (typeof callback !== 'function') {
            throw new Error('Testhelper ' + name + ' needs a done/callback function. Instead saw:' + (typeof callback));
        }
        var cloned  = hoek.clone(config);
        var context = cloned.config[name];

        if (typeof mutateDataFn === 'function') {
            mutateDataFn(context, cloned);
        }
        var path = '../../lib/rule/' + type + '/' + name + '.js';

        var fn;

        if (proxyquireInject){
            fn = proxyquire(path, proxyquireInject)[type];
        } else {
            fn = require(path)[type];
        }


        fn.call(context, harvest, reporter, callback, cloned, context);

    };
};

module.exports = {
    'callValidator': internals.applyType('validate'),
    'callPreprocessor': internals.applyType('preprocess'),
    'getTraceObject': internals.getTraceObject,
    'createReporter': internals.createReporter,
    'config': config
};
