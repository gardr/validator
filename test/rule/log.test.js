var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var hooksApi = require('../../lib/phantom/hooksApi.js');
var logHook = require('../../lib/rule/hook/log.js');
var proc = require('../../lib/rule/preprocessor/log.js');

describe('Log ', function(){

    it('hook should store calls on resultobject', function(){
        var result = {};
        var api = hooksApi({}, {}, result, 'log');

        var message = 'msg'+Math.random()*Date.now();

        logHook.onConsoleMessage(message, null, null, api);
        assert.equals(result.log.logs[0].message, message);
    });

    it('preprocessor should format dates', function(done){

        var input = {log: {logs: [{time: new Date()}]}};

        proc.preprocess(input, function(){}, function(){
            assert(input.log.logs[0].formattedTime);
            done();
        });
    });

});


