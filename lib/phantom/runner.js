var system      = require('system');

function output(data){
    console.log(JSON.stringify(data));
}

function systemError(data){
    data.systemError = true;
    output(data);
    phantom.exit(1);
}

// phantom breaking errors, most likely error in current file or arguments too the process
phantom.onError = function (msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function (t) {
            var fn = (t.function ? ' (in function ' + t.function +')' : '');
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ':' + t.line + fn);
        });
    }
    systemError({
        message: msg,
        stack: msgStack.join('\n')
    });
    return false;
};

var page        = require('webpage').create();
try{
    var createHooks = require('./createHooks.js');
    var hooksApi    = require('./hooksApi.js');
} catch(e){
    systemError({
        message: 'failed require inline modules',
        e: e
    });
}


if (system.args.length <= 1) {
    systemError({
        message: 'Missing arguments / options'
    });
} else {

    // Extended by defaults before injected
    page.options = JSON.parse(system.args[1]);

    var result = {systemErrors: []};

    try{
        var api = hooksApi(phantom, page, result);
        api.trigger = createHooks(page, page.options, api, result);
    } catch(e){
        systemError({
            message: 'Failed',
            e: e
        });
    }


    /*
        CONFIG:
    */
    page.customHeaders = page.options.headers;
    page.settings.userAgent = page.options.userAgent;
    page.viewportSize = {
        width: page.options.width,
        height: page.options.height
    };


    page.open(page.options.pageUrl, function (status) {
        if (status !== 'success') {
            return systemError({
                message: 'FAILED to load the url:' + page.options.pageUrl,
                key: 'pageUrl',
                catchedBy: 'phantom.open'
            });
        }
        page.evaluate(function(){console.log('start');});

        // result.debug = !!page.onConsoleMessage;

        try{
            api.trigger('onOpen');
        } catch(e){
            systemError({
                message: 'Failed triggering onOpen',
                e: e
            });
        }


        setTimeout(function () {
            page.evaluate(function(){console.log('exit');});
            try{
                api.trigger('onBeforeExit');
            } catch(e){
                systemError({
                    message: 'Failed onBeforeExit',
                    e: e
                });
            }


            output(result);
            phantom.exit();
        }, page.options.pageRunTime);

    });
}
