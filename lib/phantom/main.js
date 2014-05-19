/*
    PhantomJS "main"-script

*/
var getSource = require('./getSource.js');
var system = require('system');
var fs = require('fs');

var basePath = './';
var prefix = 'output-';

function output(data) {
    var timestamp = +new Date();
    var path = [basePath, '/', prefix, timestamp, '.json'].join('');
    var toStdOut = {'path': path, 'timestamp': timestamp};

    // output to file because of limitations of stdout-kb-size (for debugging)
    fs.write(path, JSON.stringify(data, null, 4), 'w');

    if (data.systemError === true){
        toStdOut.systemError = true;
        if (data.common){
            if (data.common.errors){
                toStdOut.errors = data.common.errors;
            }
            if (data.common.systemErrors){
                toStdOut.systemErrors = data.common.systemErrors;
            }
        }
    }

    // output to stdout
    console.log(
        JSON.stringify(toStdOut)
    );
}

function systemError(data) {
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

var page = require('webpage').create();

var result = {
    common: {
        startTime: Date.now(),
        systemErrors: [],
        errors: []
    }
};

page.onError = function (message, trace) {
    result.common.errors.push({
        type: 'main::page.error',
        message: message,
        trace: trace.map(function(entry){
            return {
                line: entry.line,
                sourceURL: entry.file,
                'function': entry['function']
            };
        }),
        date: Date.now()
    });
    return true;
};

var createHooks;
var hooksApi;
try {
    createHooks = require('./createHooks.js');
    hooksApi = require('./hooksApi.js');
} catch (e) {
    systemError({
        message: 'Failed require inline modules:' + e.message,
        trace: getSource(e)
    });
}

if (system.args.length <= 1) {
    systemError({
        message: 'Missing arguments / options'
    });
} else {


    // Extended by defaults before injected
    var opt = page.options = JSON.parse(system.args[1]);

    // debug
    // result.input = opt;
    basePath = opt.outputDirectory;

    // Init Hooks
    var api;
    try {
        api = hooksApi(phantom, page, result);
        api.trigger = createHooks(page, opt, api, result);
    } catch (e) {
        if (e) {
            systemError({
                message: 'Failed to create hooks:' + e.message,
                trace: getSource(e)
            });
        }
    }

    /*
        CONFIG:
    */
    page.customHeaders = opt.headers;
    page.settings.userAgent = opt.userAgent;
    page.viewportSize = {
        width: opt.viewport.width,
        height: opt.viewport.height
    };

    page.javaScriptConsoleMessageSent('Page.open starting, opening up '+opt.parentUrl);

    page.open(opt.parentUrl, function (status) {
        if (status !== 'success') {
            return systemError({
                message: 'Failed to load the url: ' + opt.parentUrl,
                key: 'pageUrl',
                catchedBy: 'phantom.open'
            });
        }

        try {
            api.trigger('onPageOpen');
        } catch (e) {
            if (e) {
                return systemError({
                    message: 'Failed to trigger onOpen: ' + e.message,
                    trace: getSource(e)
                });
            }
        }

        setTimeout(function(){
            try {
                api.trigger('onHalfTime');
            } catch (e) {
                if (e) {
                    return systemError({
                        message: 'Failed to trigger onHalfTime: ' + e.message,
                        trace: getSource(e)
                    });
                }
            }
        }, Math.round(opt.pageRunTime / 2));

        setTimeout(function () {
            page.javaScriptConsoleMessageSent('Exit started');

            try {
                api.trigger('onBeforeExit');
            } catch (e) {
                if (e) {
                    return systemError({
                        message: 'Failed to trigger onBeforeExit: ' + e.message,
                        trace: getSource(e)
                    });
                }
            }

            page.javaScriptConsoleMessageSent('Exit done');

            //finish off
            result.common.endTime = Date.now();
            output(result);
            phantom.exit();

        }, opt.pageRunTime);
    });
}
