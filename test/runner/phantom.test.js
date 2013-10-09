//var proxyquire = require('proxyquire');
var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

describe('phantom', function () {

    describe('createHar', function(){

        it('should create a har setup based on requests', function(){
            var createHAR = require('../../lib/phantom/createHAR.js');
            var requestFixture = require('./fixtures/request.js');

            var options = {
                address: 'http://about:blank',
                title: 'some title',
                startTime: new Date(),
                endTime: new Date(),
                creator: {
                    name: 'test',
                    version: '0.0.1'
                }
            };

            var entries = [];

            var report = createHAR(options, entries);

            assert.isObject(report);
            assert.equals(report.log.entries.length, entries.length);

            entries = [requestFixture, requestFixture, requestFixture, requestFixture];
            report = createHAR(options, entries);
            assert.equals(report.log.entries.length, entries.length);
        });

    });

    describe('createHooks', function(){
        var createHooks = require('../../lib/phantom/createHooks.js');

        it('should should populate page object with events', function(){
            var fixture = __dirname + '/fixtures/hook.js';
            var expectedLength = Object.keys(require(fixture)).length;

            var page = {};
            var options = {
                files: [fixture]
            };
            createHooks(page, options);

            assert.equals(expectedLength, Object.keys(page).length);
        });

        it('events should append own args with api args', function(done){
            var page = {};
            var api = {};
            var arg1 = 1;
            var arg2 = 2;
            var times;
            var fixture = {
                onBeforeExit: function(_arg1, _arg2, _api){
                    assert.equals(this, page);
                    assert.equals(_arg1, arg1);
                    assert.equals(_arg2, arg2);
                    assert.equals(_api, api);
                    times --;
                    if (times <= 0){
                        done();
                    }

                }
            };
            var options = {
                files: [fixture, fixture, fixture, fixture]
            };

            times = options.files.length;
            createHooks(page, options, api);

            page.onBeforeExit.call(page, arg1, arg2);
        });

        it('isCustom should only return if key is custom key', function(){
            refute(createHooks.isCustom('onLoadStarted'));
            assert(createHooks.isCustom('onBeforeExit'));
        });

        it('should should trigger only custom functions', function(done){
            var page = {};
            var options = {files: [{onBeforeExit: done}]};
            var trigger = createHooks(page, options);

            trigger('onBeforeExit');
        });
    });
});
