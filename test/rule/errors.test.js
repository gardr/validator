var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var hook = require('../../lib/rule/hook/errors.js');

describe('Errors hook', function () {

    it('should inject error probe in pasties frame', function () {
        var calls = 0;
        var _window = {
            'top': {
                __errors: []
            },
            'onerror': function () {
                calls++;
            }
        };
        var api = {
            'switchToIframe': function () {
                calls++;
            },
            'evaluate': function (fn) {
                global.window = _window;
                calls++;
                fn();
                global.window = null;
            }
        };

        hook.onNavigationRequested('invalid', null, null, null, api);

        assert.equals(calls, 0);

        var url = 'http://valid.no/page.html?param=param#PASTIES_' + Math.random();
        hook.onNavigationRequested(url, null, null, null, api);

        assert.equals(calls, 2);

        _window.onerror('some error', 'url', 'lineNumber');

        assert.equals(calls, 3);
        assert.equals(_window.top.__errors.length, 1);

    });

});

var validator = require('../../lib/rule/validator/errors.js');
describe('Errors validator', function () {

    it('should report usererrors as validations erros', function () {

        var called = 0;
        var report = {
            'error': function(){
                called++;
            }
        };

        var harvested = {
            systemErrors: [],
            errors: []
        };

        validator.validate(harvested, report, function(){});
        assert.equals(called, 0);


        harvested.errors.push({message: 'some error'});
        validator.validate(harvested, report, function(){});

        assert.equals(called, 1);

        harvested.systemErrors.push({message: 'another error'});
        validator.validate(harvested, report, function(){});

        assert.equals(called, 3);
    });
});
