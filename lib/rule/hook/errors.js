/*  */

// function injectErrorProbe(api) {
//     var options     = api.getOptions();
//     api.switchToIframe();
//     api.injectLocalJs(options.validatorBase + '/lib/phantom/onerror.js');
// }

module.exports = {
    // 'onNavigationRequested': function (url, type, willNavigate, main, api) {
    //     if (url.indexOf('#PASTIES') > -1) {
    //         injectErrorProbe(api);
    //     }
    // },
    // 'onInitialized': injectErrorProbe,

    'onError': function (msg, trace, api) {
        var result = api.getResultObject();

        result.errors.push({
            type: 'hook/error::page.onError',
            date: Date.now(),
            message: msg,
            trace: trace.map(function(entry){
                return {
                    line: entry.line,
                    sourceURL: entry.file,
                    'function': entry['function']
                };
            })
        });

        return true;
    }/*,
    'onBeforeExit': function (api) {
        api.switchToMainFrame();
        var result = api.getResultObject();
        var probedErrors = api.evaluate(function () {
            return window.top.__errors;
        });

        if (probedErrors) {
            probedErrors.forEach(function (entry) {
                result.errors.push(entry);
            });
        }

    }*/
};
