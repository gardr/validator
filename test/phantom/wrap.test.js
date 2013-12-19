var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;

var wrap = require('../../lib/phantom/wrap.js');

describe('Wrap', function(){

    it('should replace a function and relay calls', function(){

        var calls = 0;
        function call(){
            calls++;
        }

        global.window = {'top': {}, 'target': call};

        var key = wrap.wrapEvaluate({
            name: ['target']
        });

        assert(key);
        assert.equals(calls, 0);
        refute.equals(global.window.target, call);

        //
        global.window.target('huzzla');
        assert.equals(calls, 1);

        global.window.target('huzzla');
        assert.equals(calls, 2);

        assert.equals(calls, global.window.top[key].length);

        global.window = null;
    });

    it('should deep (3 levels) replace function as well', function(){
        var calls = 0;
        function call(){
            calls++;
        }

        global.window = {'top': {}, 'target': {'deep': {'key': call}}};

        wrap.wrapEvaluate({
            name: ['target', 'deep', 'key']
        });
        var shim = global.window.target.deep.key;

        refute.equals(shim, call);

        shim('huzzla');
        assert.equals(calls, 1);


        global.window = null;
    });

    it('should retry when not present right away', function(done){

        var calls = 0;
        function call(){
            calls++;
        }

        global.window = {'top': {}, 'target': null};

        wrap.wrapEvaluate({
            name: ['target', 'deep', 'key']
        });

        setTimeout(function(){
            global.window.target = {'deep': {'key': call}};

            setTimeout(function(){
                var shim = global.window.target.deep.key;

                refute.equals(shim, call);

                shim('huzzla');
                assert.equals(calls, 1);

                global.window = null;
                done();
            }, 5);
        }, 1);

    });


});
