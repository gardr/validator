var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var hook = require('../../lib/rule/hook/errors.js');


describe('Errors hook', function () {

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

        var result = hook.onError(message, trace, api);
        assert(result, 'hook should return true');
    });

});

var validator = require('../../lib/rule/validator/errors.js');
describe('Errors validator', function () {

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

        validator.validate(harvested, report, function(){});
        assert.equals(called, 0);


        harvested.common.errors.push({message: 'some error'});
        validator.validate(harvested, report, function(){});

        assert.equals(called, 1);

        harvested.common.systemErrors.push({message: 'another error'});
        validator.validate(harvested, report, function(){});

        assert.equals(called, 3);
    });
});
