var referee = require('referee');
var assert = referee.assert;
var refute = referee.refute;

var defaults = require('../../config/config.js').config.screenshots;
var hook = require('../../lib/rule/hook/screenshots.js');
var help = require('../lib/validateHelpers.js');

describe('screenshots', function () {

    it('should take images forever', function (done) {
        var called = 0;
        var options = {
            outputDirectory: '/a',
            width: 1,
            height: 2
        };
        var api = {
            getOptions: function(){
                return options;
            },
            getPNG: function(){
                return Math.random()*1000;
            },
            renderToFile: function(path){
                assert.equals(called, 1);
                assert.equals(path.indexOf('/a/1x2_'), 0);
                setTimeout(function(){
                    assert.equals(called, 2, 'should have been called 2 times');
                    done();
                }, defaults.ms);

            }
        };


        global.window = {
            setTimeout: function (fn) {
                called++;
                if (called === 1){
                    fn();
                }
            }
        };

        hook.onPageOpen(api, defaults);

        global.window = 0;
    });
});


