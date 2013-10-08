var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var timers = require('../../lib/rule/validator/timers.js');
var hooks  = require('../../lib/rule/hook/timers.js');
var rule   = require('../../lib/rule.js');

function getTraceObject() {
    return {
        time: new Date(),
        file: '..',
        lineNumber: '123'
    };
}

describe('timers hooks', function(){

    it('should return an object', function(){
        assert.isObject(hooks);
    });

    it('should only use hooks that exist', function(){
        Object.keys(hooks).forEach(function(hookKey){
            assert(rule.HOOKS.indexOf(hookKey) !== -1, hookKey + ' is not Valid');
        });
    });

});

describe('timers validator', function () {

    var errors = [];

    function errorCallback(error) {
        errors.push(error);
    }

    beforeEach(function () {
        errors.length = 0;
    });

    it('should not return error when one event fired', function (done) {
        var harvested = {
            setTimeout: [getTraceObject()]
        };

        timers.validate(harvested, errorCallback, function () {
            assert(errors.length === 0);
            done();
        });

    });

    it('should generate an error', function (done) {
        var harvested = {
            setTimeout: [getTraceObject(), getTraceObject(), getTraceObject(), getTraceObject()]
        };

        timers.validate(harvested, errorCallback, function () {
            assert(errors.length === 1);
            var errorObject = errors[0];
            assert(errorObject.level === 'error');
            assert.isString(errorObject.message);
            done();
        });

    });

    it('should generate multiple errors', function (done) {
        var harvested = {
            setTimeout: [getTraceObject(), getTraceObject(), getTraceObject(), getTraceObject()],
            setInterval: [getTraceObject(), getTraceObject(), getTraceObject(), getTraceObject()]
        };

        timers.validate(harvested, errorCallback, function () {
            assert(errors.length === 2);
            done();
        });

    });
});
