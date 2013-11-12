var buster = require('buster-assertions');
var assert = buster.assert;
//var refute = buster.refute;

var hooksApi = require('../../lib/phantom/hooksApi.js');

describe('HooksApi', function () {

    it('should relay call to page', function () {

        var calls = 0;

        function call() {
            calls++;
        }

        var phantom = {};
        var pageMock = {
            evaluate: call,
            switchToMainFrame: call,
            switchToFrame: call
        };
        var result = {};
        var api = hooksApi(phantom, pageMock, result);
        assert.equals(calls, 0);

        api.evaluate();
        assert.equals(calls, 1);

        api.switchToIframe();
        assert.equals(calls, 3);

        assert.equals(api.getResultObject(), result);
    });

    it.skip('should wrap...');
});
