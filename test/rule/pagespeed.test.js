var buster = require('referee');
var assert = buster.assert;
// var refute = buster.refute;

var help = require('../lib/validateHelpers.js');

describe('Pagespeed', function() {

    function generateServerResponse(score) {
        return function(options, callback) {
            var fn = require('./fixtures/pagespeed.result.js');
            var json = JSON.stringify(fn(score));
            if (callback) {
                callback(null, json);
            }
            return json;
        };
    }

    describe('Validator', function(){

        it('should report on low score', function(done){
            var harvested = {
                'pagespeed': {
                    result:  JSON.parse(generateServerResponse(50)())
                }
            };
            var reporter = help.createReporter.call(this);

            help.callValidator('pagespeed', harvested, reporter, handler);

            function handler(){
                var result = reporter.getResult();
                assert.equals(result.error.length, 1);
                done();
            }

        });

    });

    describe('Preprocessor', function() {



        it('should output data if proper response', function(done) {

            var harvested = {
                gardr: {
                    config: {
                        width: 1,
                        height: 2,
                        url: 'asd'
                    }
                }
            };

            var called = 0;
            var outputData = {};
            var output = function(key, value) {
                called++;
                outputData[key] = value;
            };

            var score = 90;

            var mock = {
                'gpagespeed': generateServerResponse(score)
            };

            help.callPreprocessor('pagespeed', harvested, output, handler, null, mock);

            function handler() {
                assert.equals(called, 1, 'expected output data');
                // console.log(outputData);
                assert.equals(outputData.result.responseCode, 200);
                assert.equals(outputData.result.score, score);
                done();
            }
        });

        it('should not run if turned off', function(done) {

            var called = 0;
            var output = function() {
                called++;
            };

            help.callPreprocessor('pagespeed', {}, output, handler, function(o){
                o.runGooglePagespeed = false;
            });

            function handler() {
                assert.equals(called, 0);
                done();
            }
        });

    });

});
