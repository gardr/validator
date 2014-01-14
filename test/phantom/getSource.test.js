var referee = require('referee');
var assert = referee.assert;
var refute = referee.refute;

var getSource = require('../../lib/phantom/getSource.js');

function PhantomError() {
    Error.apply(this, arguments);
}
PhantomError.prototype = new Error();
PhantomError.prototype.constructor = PhantomError;
PhantomError.prototype.name = 'PhantomError';

describe('getSource', function () {

    it('it should throw an error and catch it to fetch linenumber', function(){

        assert.exception(function(){
            getSource();
        });
        
        assert.exception(function(){
            var error = new Error('Testing');
            getSource(error);
        });

        var phantomError = new PhantomError('customPhantomError');

        Object.defineProperty(phantomError, 'stackArray', {
            get: function(){ return [1, 2, 3]; }
        });

        var result = getSource(phantomError);

        assert.equals(result, 3);

    });
});
