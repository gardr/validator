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

    it('should trigger swipes', function(done){
        var called = 0;
        global.document = {
            getElementById: function(){
                return {
                    querySelector: function(){
                        return 'fakeElement';
                    }
                };
            }
        };
        global.window = {
            document: global.document
        };

        var api = {
            set: function(key, value){
                if (key !== 'touchEventData'){
                    return;
                }
                assert.equals(Object.keys(value).length, 4);
                assert.equals(value.swipeTop.touchstart.length, 1);

                global.window = null;
                global.document = null;

                done();

            },
            switchToIframe: function(){

            },
            injectLocalJs: function(){
                window.swipeTop = handler;
                window.swipeRight = handler;
                window.swipeLeft = handler;
                window.swipeBottom = handler;
            },
            evaluate: function(fn, arg1, arg2){
                return fn(arg1, arg2);
            }
        };


        function handler(fakeElement, time, frames, getEvent){
            assert.equals(fakeElement, 'fakeElement');
            getEvent({type: 'touchstart', pageX: 0, pageY: 1, returnValue: true, defaultPrevented: false});
            getEvent({type: 'touchmove', pageX: 5, pageY: 1, returnValue: true, defaultPrevented: false});
            getEvent({type: 'touchend', pageX: 10, pageY: 2, returnValue: true, defaultPrevented: false});
            called++;
        }
        var config = {
            swipeTop: true,
            swipeLeft: true,
            swipeBottom: true,
            swipeRight: true,
            swipeTime: 1,
            frames: 0,
            delayBeforeNext: 1
        };

        intrumentation.onHalfTime(api, config);



        setTimeout(function(){
            assert.equals(called, 4);

            intrumentation.onBeforeExit(api, config);



        }, 10);


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
