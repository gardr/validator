var buster = require('referee');
var assert = buster.assert;
//var refute = buster.refute;

var help = require('../lib/validateHelpers.js');

var hooksApi = require('../../lib/phantom/hooksApi.js');
var intrumentation = require('../../lib/rule/instrument/log.js');
var proc = require('../../lib/rule/preprocess/log.js');


describe('Log', function(){

    it('intrumentation should store calls on resultobject', function(){
        var result = {};
        var api = hooksApi({}, {}, result, 'log');

        var message = 'msg'+Math.random()*Date.now();

        intrumentation.onConsoleMessage(message, null, null, api);
        assert.equals(result.log.logs[0].message, message);
    });

    it('preprocessor should format dates', function(done) {

        var input = {log: {logs: [
            {time: new Date()},
            {time: new Date(), message: 'test'},
            {time: new Date(), message: '!internal test'}
        ]}};

        proc.preprocess.call({}, input, function(){}, function() {
            assert(input.log.logs[0].formattedTime);
            assert(input.log.userLogs);
            assert.equals(input.log.userLogs[1].message, 'test');
            assert.equals(input.log.userLogs.length, 2);
            done();
        });
    });

    it('validator should error on log usage', function(done) {
        var harvest = {
            log: {
                logs: [{
                    time: new Date(),
                    message: 'asd'
                }],
                userLogs: [{
                    time: new Date(),
                    message: 'asd'
                }, {
                    time: new Date(),
                    message: 'asd2'
                }]
            }
        };

        function mutateOptions(context, config){
            config.config.log.errorOnConsole = true;
        }

        var reporter = help.createReporter.call(this);
        help.callValidator('log', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 2);
            done();
        }, mutateOptions);
    });

});
