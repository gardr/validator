var referee = require('referee');
var assert = referee.assert;
//var refute = referee.refute;

var defaults = require('../../config/config.js').config.actions;
var instrument = require('../../lib/rule/instrument/actions.js');
//var help = require('../lib/validateHelpers.js');


describe('Actions', function () {

    it('should trigger a click', function(done){

        global.document = {
            createEvent: function(){
                return {
                    initMouseEvent: function(){}
                };
            },
            body: {
                firstChild: {
                    querySelector: function(){
                        return {
                            dispatchEvent: function(){}
                        };
                    }
                }
            }
        };

        var calledRealImpl = 0;
        global.window = {
            open: function(){
                calledRealImpl++;
            }
        };

        var result = {actions: {}};

        var api = {
            switchToIframe: function () {},
            evaluate: function (fn, arg1) {
                return fn.call(this, arg1);
            },
            set: function(key, value){
                result.actions[key] = value;
            }
        };

        instrument.onHalfTime(api, defaults);

        window.open('some url', 'some_target');

        instrument.onBeforeExit(api, defaults);

        setTimeout(function(){
            assert.equals(calledRealImpl, 0);
            assert(result.actions.windowOpened);
            assert.equals(result.actions.windowOpened.length, 1);
            global.window = null;
            global.document = null;
            done();
        }, 170);
    });

    it.skip('should not collect har/network files after userinteraction');
});
