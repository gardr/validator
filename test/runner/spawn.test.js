var proxyquire = require('proxyquire');
var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;

describe('spawn', function () {

    before(function () {
        this.spawn = proxyquire('../../lib/spawn.js', {
            'shellout': function (bin, args, callback) {
                callback({bin: bin, args: args, callback: callback});
            }
        });
    });

    it('should call phantom with a json as argument', function (done) {
        this.spawn({pageUrl: 'about:blank', spec: {a: 'a'}}, function(argMock){
            done();
        });
    });
});
;
