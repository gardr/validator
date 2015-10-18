var referee = require('referee');
var assert = referee.assert;
//var refute = referee.refute;

var defaults = require('../../config/config.js').config.actions;
var preprocess = require('../../lib/rule/preprocess/actions.js');
var instrument = require('../../lib/rule/instrument/actions.js');
//var help = require('../lib/validateHelpers.js');

describe('Actions preprocess', function() {

    it('should filter duplicates', function(done) {

        var harvested = {
            actions: {
                navigations: [
                    {
                        "timestamp": 1444649428287,
                        "url": "http://www.finn.no/",
                        "type": "LinkClicked",
                        "willNavigate": false,
                        "main": false
                    },
                    {
                        "timestamp": 1444649428387,
                        "url": "http://www.finn.no/",
                        "type": "Other",
                        "willNavigate": false,
                        "main": false
                    }
                ],
                illegalNavigations: [
                    {
                        "timestamp": 1444649428287,
                        "url": "http://www.finn.no/",
                        "type": "LinkClicked",
                        "willNavigate": false,
                        "main": false
                    },
                    {
                        "timestamp": 1444649428587,
                        "url": "http://www.finn.no/",
                        "type": "Other",
                        "willNavigate": false,
                        "main": false
                    }
                ],
                windowOpened: [
                    {
                      "target": "new_window",
                      "time": 1444645094440,
                      "url": "http://www.gardr.org"
                    },
                    {
                      "target": "new_window",
                      "time": 1444645094490,
                      "url": "http://www.gardr.org"
                    },
                    {
                      "target": "new_window",
                      "time": 1444645094491,
                      "url": "http://www.gardr.org"
                    },
                    {
                      "target": "new_window",
                      "time": 1444645094496,
                      "url": "http://www.gardr.org"
                    },
                    {
                      "target": "new_window",
                      "time": 1444645094506,
                      "url": "http://www.gardr.org"
                    },
                    {
                      "target": "new_window",
                      "time": 1444645094546,
                      "url": "http://www.gardr.org"
                    }
                ]
            }
        };

        preprocess.preprocess(harvested, function(){}, function(){
            assert.equals(harvested.actions.navigations.length, 1);
            assert.equals(harvested.actions.illegalNavigations.length, 1);
            assert.equals(harvested.actions.windowOpened.length, 1);

            done();
        }, {}, {});

    });

});

describe('Actions instrumentation', function () {
    beforeEach(function(){
        instrument._reset();
    });

    function getSetup() {
        var obj = {};
        var child = {
            querySelector: function(){
                return {
                    dispatchEvent: function(){},
                    querySelectorAll: function(){
                        return [];
                    }
                };
            }
        };

        global.document = {
            createEvent: function(){
                return {
                    initMouseEvent: function(){}
                };
            },
            body: {
                firstElementChild: child,
                querySelector: child.querySelector
            },
            querySelectorAll: function() {
                return [child];
            }
        };

        obj.calledRealImpl = 0;
        global.window = {
            open: function(){
                obj.calledRealImpl++;
            }
        };

        obj.result = {
            actions: instrument.defaults() || {}
        };

        obj.api = {
            switchToIframe: function () {},
            evaluate: function (fn, arg1) {
                return fn.call(this, arg1);
            },
            set: function(key, value){
                obj.result.actions[key] = value;
            },
            setPush: function(key, value){
                if (obj.result.actions[key]) {
                    obj.result.actions[key] = [value];
                } else {
                    obj.result.actions[key] = value;
                }
            },
            lockNavigation: function() {},
            sendMouseEvent: function() {}
        };

        return obj;
    }

    it('should provide defaults for navigations', function(done){
        var setup = getSetup();

        instrument.onHalfTime(setup.api, defaults);

        assert.equals(setup.result.actions.navigations, [], 'expected navgations to be set');
        assert.equals(setup.result.actions.illegalNavigations, [], 'expected illegalNavigations to be set');
        assert.equals(setup.result.actions.windowOpened, [], 'expected windowOpened to be set');
        assert(setup.result.actions.actionTime, 'expected actionTime');

        done();
    });

    it('should collect for navigations', function(done){
        var setup = getSetup();

        instrument.onHalfTime(setup.api, defaults);

        instrument.onNavigationRequested(/* url */'http://www.gardr.org', /* type */'LinkClicked', /* willNavigate*/false, /* main */false, setup.api, defaults);

        assert.equals(setup.result.actions.navigations.length, 1, 'expected navgations to be 1');
        assert.equals(setup.result.actions.illegalNavigations.length, 0, 'expected illegalNavigations to be empty');

        instrument.onNavigationRequested(
            /* url */'http://www.gardr.org', /* type */'LinkClicked',
            /* willNavigate*/false, /* main */false, setup.api, defaults);

        done();
    });

    it('should collect for illegalNavigations', function(done){
        var setup = getSetup();

        instrument.onNavigationRequested(
            /* url */'http://www.gardr.org', /* type */'LinkClicked',
            /* willNavigate*/false, /* main */false, setup.api, defaults);

        assert.equals(setup.result.actions.navigations.length, 0, 'expected navgations to be empty');
        assert.equals(setup.result.actions.illegalNavigations.length, 1, 'expected illegalNavigations to be 1');


        done();
    });

    it('should trigger a click', function(done){
        var setup = getSetup();

        instrument.onCustomEvent({name: 'gardrInit'}, setup.api, defaults);
        instrument.onCustomEvent({name: 'gardrStart'}, setup.api, defaults);
        instrument.onHalfTime(setup.api, defaults);

        window.open('some url', 'some_target');
        instrument.onBeforeExit(setup.api, defaults);

        setTimeout(function(){
            assert.equals(setup.calledRealImpl, 0);
            assert(setup.result.actions.windowOpened);
            assert.equals(setup.result.actions.windowOpened.length, 1);
            global.window = null;
            global.document = null;
            done();
        }, 170);
    });
});
