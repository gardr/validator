var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var hooksApi = require('../../lib/phantom/hooksApi.js');
var logHook = require('../../lib/rule/hook/log.js');

describe('Log hook', function(){

    it('should store calls on resultobject', function(){
        var result = {logs: []};
        var api = hooksApi({}, {}, result);

        var message = 'msg'+Math.random()*Date.now();

        logHook.onConsoleMessage(message, null, null, api);
        assert.equals(result.logs[0].message, message);
    });

});
