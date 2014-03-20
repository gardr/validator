var referee = require('referee');
var assert = referee.assert;

var help = require('../lib/validateHelpers.js');
var HOOKS = require('../../lib/phantom/createHooks.js').HOOKS;

var hooks = require('../../lib/rule/hook/touch.js');
var touch = require('../../lib/rule/validator/touch.js');

describe('Touch/Swipe hooks', function () {
    it('should return an object', function () {
        assert.isObject(hooks);
    });

    it('should only use hooks that exist', function () {
        Object.keys(hooks).forEach(function (hookKey) {
            assert(HOOKS.indexOf(hookKey) !== -1, hookKey + ' is not Valid');
        });
    });
});

describe('Touch/Swipe validator', function () {

    it('should report 1 error', function (done) {
        var harvested = require('./fixtures/touch.json');

        var reporter = help.createReporter.call(this);

        touch.validate(harvested, reporter, function () {
            assert.equals(reporter.getResult().error.length, 1);
            assert.equals(reporter.getResult().info.length, 0);
            done();
        });

    });

    it('should report info about usage if no error', function (done) {
        var harvested = {
            touch: {
                touchEventData: {
                    swipeLeft: {
                        touchmove: [
                            {
                                defaultPrevented: true
                            }
                        ]
                    }
                }
            }
        };

        var reporter = help.createReporter.call(this);

        touch.validate(harvested, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 0, 'should not report errors on valid touch data object');
            assert.equals(result.info.length, 1);
            done();
        });

    });
});
