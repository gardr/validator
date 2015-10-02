var wrapElement = require('../../lib/phantom/resources/wrapElement.js');
var referee = require('referee');
var assert = referee.assert;

describe('wrapElement', function(){

    it('should throw', function(){
        assert.exception(function(){
            wrapElement();
        });
    });
    var realConsole = global.console;
    before(function() {
        global.console = {log: function(){}};
    });

    after(function(){
        global.console = realConsole;
    });

    it('should run and wrap Element.prototype.addEventListener', function(done){
        var calledSet = false;

        function addEventListener(){
            assert(calledSet);
            done();
            return this;
        }
        function Element(){
            if (!(this instanceof Element)){
                return new Element();
            }
            this.id = Date.now();
            this.className = this.id + ' ' + this.id;
            return this;
        }


        var listener = addEventListener.bind(Element);

        Element.prototype.setAttribute = function(){
            calledSet = true;
        };
        Element.prototype.addEventListener = listener;

        global.window = {
            Element: Element
        };

        wrapElement(['click']);

        var wrapped = global.window.Element.prototype.addEventListener;

        referee.refute.equals(wrapped, listener);

        wrapped.call(new Element(), 'click', function clickHandler(){}, false);

        global.window = null;
    });

});
