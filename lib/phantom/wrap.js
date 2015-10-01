/* jshint evil:true */
// keep everything inline, as function will be tostringed and evaluated between phantomjs contexts
function wrapEvaluate(_opt) {
    return (function wrapped(opt) {
        // generate id, we use id as a global probe storage
        var key = opt.name.join('.') + '_store_' + Math.round(Date.now() * Math.random() * 100);
        var store = (window.top[key] = []);

        function getErrorObject() {
            var catched;
            try {
                throw new Error('Usage violation');
            } catch (err) {
                catched = err;
            }
            return catched.stackArray ? catched.stackArray[catched.stackArray.length - 1] : catched;
        }

        var name = opt.name;
        var cursor = window;
        var oldCursor = window;
        var methodName = name[name.length - 1];
        var timer = 0;
        var done = false;

        function query() {
            if (done === true) {
                return;
            }
            try {
                // only support 3 levels atm,eg: window.level1.level2.level3;
                // using ugly notation here because couldnt get the references to stick otherwise
                if (name.length === 3) {
                    oldCursor = cursor[name[0]][name[1]][name[2]];
                    cursor[name[0]][name[1]][name[2]] = shim;
                } else if (name.length === 2) {
                    oldCursor = cursor[name[0]][name[1]];
                    cursor[name[0]][name[1]] = shim;
                } else {
                    oldCursor = cursor[name[0]];
                    cursor[name[0]] = shim;
                }
                //console.log('replaced '+methodName+' timer:'+timer);
                done = true;
            } catch (e) {
                timer += 5;
                setTimeout(query, timer);
            }
        }
        // if missing er requery dom until forever
        setTimeout(query, timer);
        // init
        query();


        if (!oldCursor && opt.impl && typeof opt.impl === 'string') {
            try{
                /*
                    Passing in fn as option instead of running page.evaluate
                    if future versions of Phantom support implementation
                */
                oldCursor = new Function('return '+opt.impl)();
            } catch(e){
                console.log('!internal try catch failed on '+opt.impl+'. Error:'+JSON.stringify(e));
            }

        }

        function shim() {
            //console.log('SHIM called:', methodName, 'event', key);
            store.push({
                name: methodName,
                date: Date.now(),
                trace: getErrorObject()
            });
            if (oldCursor) {
                return oldCursor.apply(this, Array.prototype.slice.call(arguments));
            }
        }

        return key;
    })(_opt);
}

function createWrap(page) {
    // TODO, make name be an list/array of names - to use same shim.
    return function wrap(name, impl) {
        var key;
        // check if already wrapped
        page.switchToMainFrame();
        page.switchToFrame(0);

        name = name.split('.');

        // wrap a global function
        key = page.evaluate(wrapEvaluate, {
            name: name,
            impl: impl && impl.toString()
        });

        // collect result
        return function () {
            return page.evaluate(function (key) {
                return window.top[key];
            }, key);
        };
    };
}

module.exports = {
    createWrap: createWrap,
    wrapEvaluate: wrapEvaluate
};
