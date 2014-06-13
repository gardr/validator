var referee = require('referee');
var assert = referee.assert;
//var refute = referee.refute;

var help    = require('../lib/validateHelpers.js');
var HOOKS   = require('../../lib/phantom/createHooks.js').HOOKS;

var instrumentation   = require('../../lib/rule/instrument/timers.js');
var timers  = require('../../lib/rule/validate/timers.js');

function getTraceList(targetNum, i){
    var res = [];
    if (typeof i === 'undefined'){
        i = 0;
    } else {
        targetNum = i + targetNum;
    }

    for(;i<=targetNum; i++){
        res.push(help.getTraceObject(i+1));
    }

    return res;
}


describe('timers instrumentation', function(){

    it('should return an object', function(){
        assert.isObject(instrumentation);
    });

    it('should only use instrumentation that exist', function(){
        Object.keys(instrumentation).forEach(function(hookKey){
            assert(HOOKS.indexOf(hookKey) !== -1, hookKey + ' is not Valid');
        });
    });

    it('should wrap timeouts', function(done){

        var called = 0;
        var wrappedCalled = 0;
        var wrappedResolve = 0;
        var api = {
            switchToIframe: function(){},
            wrap: function(){
                wrappedCalled++;
                return function(){
                    wrappedResolve++;
                };
            },
            set: function(){
                called ++;
                if (called === 3){
                    assert.equals(wrappedCalled, 5);
                    assert.equals(wrappedResolve, 4);
                    done();
                }
            }
        };

        var ignoreResponse = {};
        var response2 = {stage: 'end', url: 'iframe.html'};

        instrumentation.onResourceReceived(ignoreResponse, api);

        instrumentation.onResourceReceived(response2, api, {nameToTriggerWrap: 'iframe.html'});

        instrumentation.onBeforeExit(api);

    });

});

describe('timers validator', function () {

    it('should not return error when one event fired', function (done) {
        var harvested = {
            'timers': {
                setTimeout: [
                    [help.getTraceObject(1)]
                ]
            }
        };

        var reporter = help.createReporter.call(this);

        timers.validate(harvested, reporter, function () {
            assert.equals(reporter.getResult().error.length, 0);
            done();
        });

    });

    it('should generate an error', function (done) {
        var harvested = {
            'timers': {
                setTimeout: [
                    getTraceList(21)
                ]
            }
        };

        var reporter = help.createReporter.call(this);

        timers.validate(harvested, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1);
            var errorObject = result.error[0];
            assert.isString(errorObject.message);
            done();
        });

    });

    it('should generate multiple errors', function (done) {
        var harvested = {
            'timers': {
                setTimeout: [
                    getTraceList(21)
                ],
                setInterval: [
                    getTraceList(5, 21)
                ]
            }
        };

        var reporter = help.createReporter.call(this);

        timers.validate(harvested, reporter, function () {
            assert.equals(reporter.getResult().error.length, 2);
            done();
        });

    });
});
