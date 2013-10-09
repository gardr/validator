var RUN_PAGE_TIME = 10000;

// phantom breaking errors, most likely error in current file or arguments too the process
phantom.onError = function (msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function (t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
        });
    }
    console.log(JSON.stringify({
        error: true,
        stack: msgStack.join('\n')
    }));
    phantom.exit(1);
};

var page        = require('webpage').create();
var system      = require('system');
//var createHAR   = require('./createHAR.js');
var createHooks = require('./createHooks.js');
var hooksApi    = require('./hooksApi.js');


if (system.args.length === 1) {
    console.log(JSON.stringify({
        message: 'Missing options',
        error: true
    }));
    phantom.exit(1);
} else {

    // Extended by defaults before injected
    page.options = JSON.parse(system.args[1]);

    var api = hooksApi(phantom, page);
    var triggerHook = createHooks(page, page.options.files, api);

    // todo move to options
    page.customHeaders = page.options.headers;

    page.settings.userAgent = page.options.userAgent;
    page.viewportSize = {
        width: page.options.width,
        height: page.options.height
    };


    page.open(page.address, function (status) {

        setTimeout(function () {

            triggerHook('onBeforeExit');

            phantom.exit();
        }, RUN_PAGE_TIME);

    });
}
