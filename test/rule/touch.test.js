var referee = require('referee');
var assert = referee.assert;

var help = require('../lib/validateHelpers.js');

var HOOKS = require('../../lib/phantom/createHooks.js').HOOKS;
var intrumentation = require('../../lib/rule/instrument/touch.js');

describe('Touch/Swipe intrumentation', function () {
    it('should return an object', function () {
        assert.isObject(intrumentation);
    });

    it('should only use intrumentation that exist', function () {
        Object.keys(intrumentation).forEach(function (hookKey) {
            assert(HOOKS.indexOf(hookKey) !== -1, hookKey + ' is not Valid');
        });
    });
});

describe('Touch/Swipe validator', function () {

    it('should report 1 error', function (done) {
        var harvested = require('./fixtures/touch.json');

        var reporter = help.createReporter.call(this);

        help.callValidator('touch', harvested, reporter, function () {
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

        help.callValidator('touch', harvested, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 0, 'should not report errors on valid touch data object');
            assert.equals(result.info.length, 1);
            done();
        });

    });
});
