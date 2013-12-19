var buster = require('referee');
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

        var apiContext = api.createSubContext(this.test.title);

        assert.equals(calls, 0);

        //
        apiContext.evaluate();
        assert.equals(calls, 1);

        apiContext.switchToIframe();
        assert.equals(calls, 3);

        apiContext.injectLocalJs();
        assert.equals(calls, 4);

        apiContext.switchToMainFrame();
        assert.equals(calls, 5);

        assert.equals(apiContext.getGlobalResultObject(), result);
    });

    it('should append data to context structure', function(){

        var api = hooksApi({}, {}, {}, 'common');

        api.set('inCommon', 1);
        assert.equals(api.getResult().inCommon, 1);

        var context = api.createSubContext('sub');

        context.set('inSub', 1);
        assert.equals(context.getResult().inSub, 1);

        var result = api.getGlobalResultObject();

        assert.equals(result.common.inCommon, 1);
        assert.equals(result.sub.inSub, 1);

    });
});
