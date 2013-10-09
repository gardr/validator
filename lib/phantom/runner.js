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

    // todo, extend defaults
    page.options = JSON.parse(system.args[1]);

    var api = hooksApi(phantom, page);
    var triggerHook = createHooks(page, page.options.files, api);

    // todo move to options
    page.customHeaders = {
        'Cache-Control': 'no-cache',
        // diable gzip compressions, doesnt work as we want. gzip etc should be collected insize introspection anyway.
        'Accept-Encoding': ' '
    };

    page.settings.userAgent = 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25';
    page.viewportSize = {
        width: 980,
        height: 225
    };


    page.open(page.address, function (status) {

        setTimeout(function () {

            triggerHook('onBeforeExit');

            phantom.exit();
        }, RUN_PAGE_TIME);

    });
}
