var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var proxyquire = require('proxyquire');

describe('spawn', function () {

    before(function () {
        this.spawn = proxyquire('../../lib/spawn.js', {
            'child_process': {
                execFile: function (bin, args, callback) {
                    callback(null, {bin: bin, args: args, callback: callback});
                }
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
            assert.equals(JSON.stringify(input), argMock.args[2]);
            done();
        });
    });
});
