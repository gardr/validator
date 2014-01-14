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

        function call2(){
            calls++;
        }

        global.window = {'top': {}, 'target': call, 'target2': {'sub1': call2}};

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


        key = wrap.wrapEvaluate({
            name: ['target2', 'sub1']
        });
        assert(key);

        global.window.target2.sub1('huzzla');
        refute.equals(global.window.target2.sub1, call2);
        assert.equals(calls, 3);

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


    it('createWrap should run evaluate on the page object', function(done){

        var evalCalls = 0;
        var page = {
            switchToMainFrame: function(){},
            switchToFrame: function(){},
            evaluate: function(fn, key){
                evalCalls++;
                if (evalCalls === 1){
                    return key.name;
                }
                if (evalCalls === 2){
                    setTimeout(done, 0);
                    return fn(key);
                }
            }
        };

        global.window = {
            top: {dummy: 1}
        };

        var wrapper = wrap.createWrap(page);
        var fn      = wrapper('dummy', function(){});
        assert.equals(evalCalls, 1, 'should call evaluate');

        var result = fn('dummy');

        assert.equals(result, global.window.top.dummy);

        global.window = null;
    });

});
