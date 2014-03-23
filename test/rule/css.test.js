var referee = require('referee');
var assert = referee.assert;
//var refute = referee.refute;

var config = require('../../config/config.js');
var defaults = config.config.css;
var cssHOOK = require('../../lib/rule/hook/css.js');

describe('CSS hook', function () {

    it('it should collect styles and filter', function(){

        var result = {};
        var api = {
            'set' : function(key, value){
                result[key] = value;
            },
            'evaluate' : function(fn, arg1){
                return fn(arg1);
            },
            'switchToIframe' : function(){

            }
        };


        function dom(content){
            return {
                innerHTML: content
            };
        }

        global.document = {
            querySelectorAll: function () {
                return [dom('* { padding: 0; margin: 0; border: 0; }'), dom('ignore GARDR {background:red;}'), dom('me #GARDR{background:blue;}'), dom('validate {background:yellow;}')];
            }
        };

        cssHOOK.onBeforeExit(api, defaults);

        global.document = null;

        assert.isArray(result.styles);
        assert.equals(result.styles.length, 1);


    });

});

var cssValidator = require('../../lib/rule/validator/css.js');
var help = require('../lib/validateHelpers.js');

describe('CSS validator', function(){

    it('should fail on tag styling', function(done){
        var harvest = {
            css : {
                styles: [
                    'body {background:red;}',
                    'p{background: red;}html{background:blue;}',
                    'should filter out {margin: 0}',
                    '.classname {background: orange;}'
                ],
            },
            har: {
                file: {}
            }
        };

        var reporter = help.createReporter.call(this);

        cssValidator.validate(harvest, reporter, function(){

            var result = reporter.getResult();

            assert.equals(result.error.length, 3, 'should filter tags with usages except margin/padding');

            done();
        }, config);
    });

});
