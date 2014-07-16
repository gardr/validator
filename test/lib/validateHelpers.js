var hoek = require('hoek');
var config = require('../../config/config.js');
var validate = require('../../lib/validate.js');


var internals = {};

internals.getTraceObject = function (name) {
    return {
        'name': name + '',
        'time': Date.now(),
        'trace': {
            sourceURL: 'http://gardr.org/dummyfile.js',
            line: '123'
        }
    };
};

internals.createReporter = function (onCallFn) {
    return validate.createReportHelper({}, onCallFn)(this.test.title);
};

internals.resolveUrlForType = function(type, name){
    return '../../lib/rule/' + type + '/' + name + '.js';
};

internals.createOutputter = function(name, data){
    var module = require(internals.resolveUrlForType('preprocess', name));
    return validate.createOutputter(module, data);
};

internals.applyType = function (type) {
    var proxyquire = require('proxyquire').noPreserveCache();
    return function (name, harvest, reporter, callback, mutateDataFn, proxyquireInject) {
        if (!harvest) {
            throw new Error('Testhelper ' + name + ' needs a harvest object');
        }
        if (!reporter) {
            if (type === 'preprocess'){
                reporter = internals.createOutputter(name, harvest);
            } else {
                throw new Error('Testhelper ' + name + ' needs a reporter');
            }
        }
        if (typeof callback !== 'function') {
            throw new Error('Testhelper ' + name + ' needs a done/callback function. Instead saw:' + (typeof callback));
        }
        var cloned  = hoek.clone(config);
        var context = cloned.config[name];

        if (typeof mutateDataFn === 'function') {
            mutateDataFn(context, cloned);
        }
        var path = internals.resolveUrlForType(type, name);

        var fn;

        if (proxyquireInject){
            fn = proxyquire(path, proxyquireInject)[type];
        } else {
            fn = require(path)[type];
        }

        fn.call(context, harvest, reporter, callback, cloned, context);

        return reporter;
    };
};


var createInstrumentationApi = require('../../lib/phantom/hooksApi.js');
internals.createPhantomHooksApi = function (page){
    var options = {
        'key': (Math.random() * 1000 * Date.now())
    };
    var o = {
        'options' : options,
        'calls' : 0,
        'otherCalls': {},
        'lastOptionsArg' : null,
        'injected' : [],
        'data': {},
        'phantom': {},
        'page': null,
        'result': {},
        'call': incCalls()
    };


    o.page = {
        'evaluate': function(fn, lastOptionsArg){
            o.lastOptionsArg = lastOptionsArg;
            //setup
            var res = fn();
             //cleanup
            o.call();
            return res;
        },
        'injectJs': function (str) {
            o.injected.push(str);
            o.call();
        },
        'renderBase64': incCalls('render'),
        'render': incCalls('render'),
        'switchToMainFrame': incCalls('switch'),
        'switchToFrame': incCalls('switch'),
        'options': options
    };

    if (page){
        for(var key in page){
            o.page[key] = page[key];
        }
    }

    function incCalls(inc){
        return function(){
            if (typeof inc !== 'undefined'){
                if(typeof o.otherCalls[inc] === 'undefined'){
                    o.otherCalls[inc] = 0;
                }
                o.otherCalls[inc]++;
            } else {
                o.calls++;
            }
        };
    }

    o.api = createInstrumentationApi(o.phantom, o.page, o.result, o.options.key);

    return o;
};

module.exports = {
    'callValidator': internals.applyType('validate'),
    'callPreprocessor': internals.applyType('preprocess'),
    'getTraceObject': internals.getTraceObject,
    'createReporter': internals.createReporter,
    'createOutputter': internals.createOutputter,
    'createApi': internals.createPhantomHooksApi,
    'config': config
};
