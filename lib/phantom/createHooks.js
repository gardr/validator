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
    {method: 'onBeforeExit', args: [], custom: true}

];

function isCustom(key){
    return HOOKS.some(function(entry){ return entry.method === key && entry.custom === true});
}


function requireFilesAndMapToLists(files){
    var hooks = {};

    files.forEach(function(file){
        // its possible to inject object instead of file reference
        var mod = typeof file === 'object' ? file : require(file);
        Object.keys(mod).forEach(function(key){
            hooks[key] = hooks[key]||[];

            // collect
            hooks[key].push(file[key]);
        });

    });

    return hooks;
}


function createPartialWrapper(key, callbacks, appendArgs) {
    return function () {
        var context = this;
        var args = Array.prototype.slice.call(arguments);

        function handler(cb) {
            if (typeof cb === 'function') {
                // todo, if done is in arg list, async mode is on
                cb.apply(context, cb.length > args.length ? args.concat(appendArgs) : args);
            }
        }
        callbacks[key].forEach(handler);
    };
}

module.exports = function (page, options, appendArgs) {
    appendArgs = Array.isArray(appendArgs) ? appendArgs : [appendArgs];
    var callers = requireFilesAndMapToLists(options.files);
    var callbacks = {};

    // only listen for predefined hooks ( white-list )
    HOOKS.forEach(function (hook) {
        var key = hook.method;
        var cbList = callers[key];
        // ..
        if (!cbList && typeof cbList !== 'function') {
            return;
        }

        if (!callbacks[key]) {
            callbacks[key] = [];
        }
        // mutate
        callbacks[key].push.apply(callbacks[key], cbList);

        if (page[key]) {
            return;
        }

        page[key] = createPartialWrapper(key, callbacks, appendArgs);

    });

    return function(key){
        if (page[key] && isCustom(key)){
            page[key]();
        }
    };
};
module.exports.isCustom = isCustom;
module.exports.HOOKS = HOOKS.map(function(value){return value.method;});
