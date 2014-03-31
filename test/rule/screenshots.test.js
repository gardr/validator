var pathLib = require('path');
var referee = require('referee');
var assert = referee.assert;
//var refute = referee.refute;

var help = require('../lib/validateHelpers.js')
var defaults = require('../../config/config.js').config.screenshots;
var instrumentation = require('../../lib/rule/instrument/screenshots.js');

describe('Screenshots instrumentation', function () {

    it('should take images forever', function (done) {
        var called = 0;
        var options = {
            outputDirectory: '/a',
            viewport: {
                width: 1,
                height: 2
            }
        };
        var api = {
            getOptions: function () {
                return options;
            },
            getPNG: function () {
                return Math.random() * 1000;
            },
            renderToFile: function (path) {
                assert.equals(called, 1);
                assert.equals(path.indexOf('/a/1x2_'), 0);
                setTimeout(function () {
                    assert.equals(called, 2, 'should have been called 2 times');
                    done();
                }, defaults.ms);

            }
        };

        global.window = {
            setTimeout: function (fn) {
                called++;
                if (called === 1) {
                    fn();
                }
            }
        };

        instrumentation.onPageOpen(api, defaults);

        global.window = 0;
    });
});

describe('Screenshots preprocessor', function () {

    it('should preprocess data', function (done) {
        var harvested = {
            'common': {
                startTime: +new Date()
            }
        };

        function mutateOptions(config, opt){
            opt.outputDirectory = pathLib.join(__dirname, 'fixtures', 'screenshots');
        }

        var called = 0;
        var outputData = {};
        var output = function(key, value){
            called++;
            outputData[key] = value;
        };
        help.callPreprocessor('screenshots', harvested, output, function () {
            assert.equals(called, 3);
            assert.equals(outputData.hasScreenshots, true);
            assert(outputData.firstImage);
            assert.isArray(outputData.images);
            assert.equals(outputData.images.length, 3);
            done();
        }, mutateOptions);
    });
});
