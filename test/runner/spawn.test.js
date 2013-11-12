var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

var proxyquire = require('proxyquire');

describe('spawn', function () {

    before(function () {
        this.spawn = proxyquire('../../lib/spawn.js', {
            'shellout': function (bin, args, callback) {
                callback(null, {bin: bin, args: args, callback: callback});
            }
        });
    });

    after(function(){
        this.spawn = null;
    });

    it('should call phantom with a json as argument', function (done) {
        var input = {pageUrl: 'about:blank', spec: {a: 'a'}};
        this.spawn(input, function( argMock){
            refute.equals(input, argMock);
            assert(~argMock.args[1].indexOf('headers'), 'Smoketest options failed');
            done();
        });
    });
});
