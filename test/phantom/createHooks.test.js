var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var hooksApi = require('../../lib/phantom/hooksApi.js');
var createHooks = require('../../lib/phantom/createHooks.js');

describe('createHooks', function () {

    var baseApi = hooksApi({}, {}, {}, 'common');

    it('should should populate page object with keys (hooks/pageevents)', function () {
        var fixture = __dirname + '/fixtures/hook.js';
        var expectedLength = Object.keys(require(fixture)).length;

        var page = {};
        var options = {
            'instrument': [fixture]
        };
        createHooks(page, options, baseApi.createSubContext(this.test.title));

        assert.equals(expectedLength, Object.keys(page).length);
    });

    it('events should append own args with api args', function (done) {
        var page = {};
        var arg1 = 1;
        var arg2 = 2;
        var times;

        function getFixture(name) {
            return {
                name: name,
                onBeforeExit: function () {
                    setTimeout(finish.apply(this, Array.prototype.slice.call(arguments)), 1);
                }
            };
        }
        var options = {
            'instrument': [getFixture('key1'), getFixture('key2'), getFixture('key3'), getFixture('key4')]
        };

        times = options.instrument.length;
        createHooks(page, options, baseApi);

        page.onBeforeExit.call(page, arg1, arg2);

        function finish(_arg1, _arg2, _api) {
            var self = this;
            return function () {
                assert.equals(self, page, 'context/this should be page');
                assert.equals(_arg1, arg1, 'arg1 should be same as passed in');
                assert.equals(_arg2, arg2, 'arg2 should be same as passed in');
                refute.equals(_api.name, baseApi.name);
                times--;
                if (times <= 0) {
                    done();
                }
            };
        }

    });

    it('isCustom should only return if key is custom key', function () {
        refute(createHooks.isCustom('onLoadStarted'));
        assert(createHooks.isCustom('onBeforeExit'));
    });

    it('should should trigger only custom functions', function (done) {
        var page = {};
        var testTitle = this.test.title;
        var api = baseApi.createSubContext('common');
        var called = 0;
        var options = {
            instrument: [{
                name: testTitle,
                onAlert: function(msg, _api){
                    if (msg && _api){
                        called++;
                    }
                },
                onBeforeExit: function (_api) {
                    called++;
                    setTimeout(finish(_api), 1);
                }
            }]
        };
        var trigger = createHooks(page, options, api);

        page.onAlert('message');
        trigger('onBeforeExit');


        function finish(_api) {
            return function () {
                _api.set('key', 'value');
                assert.equals(called, 2);
                assert.isObject(_api, '_api should be a object');
                assert.equals(_api.getResult().key, 'value', 'context value should be correct');
                assert.equals(_api.name, testTitle, 'api inside should be in correct context');

                assert.equals(api.name, 'common');
                assert.equals(api.getGlobalResult()[testTitle].key, 'value');
                done();
            };
        }

    });
});
