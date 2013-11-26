var getSource = require('./getSource.js');

// args not needed, but nice for docs meanwhile... todo remove
var HOOKS = [
    {method: 'onAlert',                 args: ['msg']},
    {method: 'onCallback',              args: ['data']}, // -> window.callPhantom({ hello: 'world' });
    {method: 'onClosing',               args: ['closingPage']},
    {method: 'onConfirm',               args: ['msg']},
    {method: 'onConsoleMessage',        args: ['msg', 'lineNum', 'sourceId']},
    {method: 'onError',                 args: ['msg', 'trace']},
    {method: 'onFilePicker',            args: []}, // ?
    {method: 'onInitialized',           args: []}, // probes best placed here?
    {method: 'onLoadFinished',          args: ['status']},
    {method: 'onLoadStarted',           args: []},
    {method: 'onNavigationRequested',   args: ['url', 'type', 'willNavigate', 'main']},
    {method: 'onPageCreated',           args: ['newPage']},
    {method: 'onPrompt',                args: ['msg', 'defaultVal']},
    {method: 'onResourceRequested',     args: ['requestData', 'networkRequest']},
    {method: 'onResourceReceived',      args: ['response']},
    {method: 'onUrlChanged',            args: ['targetUrl']},
    {method: 'onResourceError',         args: ['resourceError']},
    // custom
    {method: 'onPageOpen', args: [], custom: true},
    {method: 'onBeforeExit', args: [], custom: true}

];
function isCustom(key) {
    return HOOKS.some(function (entry) {
        return entry.method === key && entry.custom === true;
    });
}

function requireFilesAndMapToLists(files) {
    var hooks = {};

    if (files && Array.isArray(files)) {
        files.forEach(function (file) {
            // its possible to inject object instead of file reference
            var mod = typeof file === 'object' ? file : require(file);

            Object.keys(mod).forEach(function (key) {
                hooks[key] = hooks[key] || [];

                // PUSH CALLBACK
                hooks[key].push(mod[key]);
            });
        });
    }

    return hooks;
}

function enforceLength(list, enforcedLength) {
    if (list.length < enforcedLength) {
        list.length = enforcedLength;
    }
    return list;
}

function createPartialWrapper(hook, callbacks, api) {
    var key = hook.method;
    return function () {

        var context = this;
        var args = Array.prototype.slice.call(arguments);
        args = enforceLength(args, hook.args.length);
        args = args.concat(api);

        function handler(cb) {
            if (typeof cb === 'function') {
                // todo, if done is in arg list, async mode is on
                try {
                    cb.apply(context, args);
                } catch (e) {
                    if (api && api.getResultObject) {
                        api.getResultObject().systemErrors.push({
                            original: args.length,
                            message: key + ' failed executing handler: ' + e.message,
                            // todo collect filename + lineNumber
                            trace: getSource(e)
                        });
                    } else {
                        // if in test-runner-context
                        throw e;
                    }
                }
            }
        }
        callbacks[key].forEach(handler);
    };
}

module.exports = function (page, options, api) {
    var callers = requireFilesAndMapToLists(options.hooks);

    //if (result) result.callers = Object.keys(callers);
    var alreadyHookedUp = {};
    var callbacks = {};

    // only listen for predefined hooks ( white-list )
    HOOKS.forEach(function (hook) {
        var key = hook.method;

        var mapList = callers[key];

        if (!mapList) {
            return;
        }

        if (!callbacks[key]) {
            callbacks[key] = [];
        }
        // mutate
        callbacks[key].push.apply(callbacks[key], mapList);

        if ( alreadyHookedUp[key] === true ) {
            return;
        }

        page[key] = createPartialWrapper(hook, callbacks, api);
        alreadyHookedUp[key] = true;
    });

    return function (key) {
        var isValid = !! (page[key] && isCustom(key));
        if (isValid) {
            page[key](api);
        }
    };
};
module.exports.isCustom = isCustom;
module.exports.HOOKS = HOOKS.map(function (value) {
    return value.method;
});
