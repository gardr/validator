var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var hook = require('../../lib/rule/hook/har.js');

describe('HAR hook', function () {

    it('should store calls on probedata', function () {

        var result = {};
        var api = {
            getResultObject: function(){
                return result;
            }
        };

        hook.onLoadStarted();
        hook.onResourceRequested({id: 1});
        hook.onResourceReceived({id: 1, stage: 'start'});
        hook.onResourceReceived({id: 1, stage: 'end'});
        hook.onPageOpen();
        hook.onBeforeExit(api);

        var res = result.har_input.resources;

        assert.equals(res.length, 1);
        assert(res[0].startReply);
        assert(res[0].endReply);

    });

});

var proxyquire = require('proxyquire');

describe('HAR validator', function () {

    var validator = proxyquire('../../lib/rule/validator/har.js', {
        '../../createHAR.js': function (options, harInput) {
            return harInput;
        }
    });

    it('should call createHar and output to report', function (done) {

        var harvested = {
            har_input: {}
        };

        validator.validate(harvested, null, function () {
            assert(harvested.har_file);
            assert.equals(harvested.har_file, harvested.har_input);
            done();
        });
    });
});
