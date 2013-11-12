var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var hooksApi = require('../../lib/phantom/hooksApi.js');

describe('HooksApi', function () {

    it('should relay call to page', function () {

        var calls = 0;

        function call() {
            calls++;
        }

        var phantom = {};
        var phantomWebpageInstance = {
            'evaluate': call,
            'switchToMainFrame': call,
            'switchToFrame': call,
            'injectJs': call
        };
        var result = {};
        // init hooks
        var api = hooksApi(phantom, phantomWebpageInstance, result);
        assert.equals(calls, 0);

        //
        api.evaluate();
        assert.equals(calls, 1);

        api.switchToIframe();
        assert.equals(calls, 3);

        api.injectLocalJs();
        assert.equals(calls, 4);

        api.switchToMainFrame();
        assert.equals(calls, 5);

        assert.equals(api.getResultObject(), result);
    });

});
