/*  */

function injectErrorProbe(api) {
    api.switchToIframe();
    api.evaluate(function () {
        var errors = (window.top.__errors = window.top.__errors || []);
        (function (oldHandler) {
            window.onerror = function (message, url, line) {

                var errorObj = {
                    type: 'hook/error::window.onerror',
                    message: message,
                    date: Date.now(),
                    url: url,
                    line: line
                };

                errors.push(errorObj);

                if (typeof odlHandler === 'function') {
                    oldHandler.apply(this, Array.prototype.slice.call(arguments));
                }
                return true;

            };
        })(window.onerror);
    });
}

module.exports = {
    'onNavigationRequested': function (url, type, willNavigate, main, api) {
        if (url.indexOf('mobile.htm') > -1) {
            injectErrorProbe(api);
        }
    },
    'onInitialized': injectErrorProbe,

    'onError': function (msg, trace, api) {
        var result = api.getResultObject();

        result.errors.push({
            type: 'hook/error::page.onError',
            date: Date.now(),
            message: msg,
            trace: trace
        });

        return true;
    },
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

    }
};
