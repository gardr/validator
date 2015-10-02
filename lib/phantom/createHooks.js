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
    {method: 'onCustomEvent', args: ['data'], custom: true},
    {method: 'onPageOpen', args: [], custom: true},
    {method: 'onBeforeExit', args: [], custom: true},
    {method: 'onHalfTime', args: [], custom: true}

];
function isCustom(key) {
    return HOOKS.some(function (entry) {
        return entry.method === key && entry.custom === true;
    });
}

var REG_EXP_MATCH_FILENAME = /[^\/\\]*\.(\w+)$/;
var REG_EXP_TRIM_ENDING = /\..*$/;
function getFileName(str){
    var match = str.match(REG_EXP_MATCH_FILENAME);
    return match && match[1] ? match[0].replace(REG_EXP_TRIM_ENDING, '') : match ? match[0] : str;
}

function requireFilesAndMapToLists(files) {
    var hooks = {};

    if (files && Array.isArray(files)) {
        files.forEach(function (file) {
            // its possible to inject object instead of file reference
            var mod;
            if (typeof file === 'object'){
                if (file.code){
                    // TODO code as string
                    // mod;
                } else if (file.path){
                    mod = require(file.path);
                    if(!mod.name){
                        mod.name = getFileName(file.path);
                    }
                } else {
                    mod = file;
                }
            } else {
                mod = require(file);
                if(!mod.name){
                    mod.name = getFileName(file);
                }
            }

            if (!mod.name){
                throw new Error('Missing instrument filename from module exports.');
            }

            Object.keys(mod).forEach(function (key) {
                if (key === 'name'){
                    return;
                }
                hooks[key] = hooks[key] || [];

                // PUSH CALLBACK
                hooks[key].push({
                    'callback': mod[key],
                    'name': mod.name
                });
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
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        args = enforceLength(args, hook.args.length);

        function runCallbacks(entry) {
            if (typeof entry.callback !== 'function') {
                // what to do=
                throw new Error('createPartialWrapper Missing Callback');
                return;
            }
            try {
                var options = api.getOptions();
                var apiContext = [
                    api.createSubContext(entry.name),
                    options && options.config[entry.name]
                ];
                entry.callback.apply(self, args.concat(apiContext));
            } catch (e) {
                if (api && api.getGlobalResult) {
                    api.getGlobalResult().common.systemErrors.push({
                        original: args.length,
                        message: key + ' failed executing handler: ' + e.message,
                        trace: getSource(e)
                    });
                } else {
                    // if in test-runner-context
                    throw e;
                }
            }
        }
        callbacks[key].forEach(runCallbacks);
    };
}

module.exports = function (page, options, api) {
    var callers = requireFilesAndMapToLists(options.instrument);

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
            page[key]();
        }
    };
};
module.exports.isCustom = isCustom;
module.exports.HOOKS = HOOKS.map(function (value) {
    return value.method;
});
