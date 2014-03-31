var buster = require('referee');
var assert = buster.assert;

var instrumentation = require('../../lib/rule/instrument/common.js');


describe('Common instrumentation', function () {

    it('should report error', function (done) {

        var message = 'msg';
        var trace = [{line: 1, file: 2, 'function': 3}];
        var api = {
            setPush: function(key, entry){
                assert(key, 'errors');
                assert.equals(entry.message, message);
                assert.equals(entry.trace[0].sourceURL, trace[0].file);
                done();
            }
        };

        var result = instrumentation.onError(message, trace, api);
        assert(result, 'instrumentation should return true');
    });

});

var help        = require('../lib/validateHelpers.js');

describe('Common validator', function () {

    it('should report usererrors as validations errors', function () {

        var called = 0;
        var report = {
            'error': function(){
                called++;
            }
        };

        var harvested = {
            'common': {
                systemErrors: [],
                errors: []
            }
        };

        help.callValidator('common', harvested, report, function(){});
        assert.equals(called, 0);


        harvested.common.errors.push({message: 'some error'});
        help.callValidator('common', harvested, report, function(){});

        assert.equals(called, 1);

        harvested.common.systemErrors.push({message: 'another error'});
        help.callValidator('common', harvested, report, function(){});

        assert.equals(called, 3);
    });
});
