var wrapEvaluate = require('./wrapEval.js');

module.exports = function createApi(phantom, page, result) {

    return {
        evaluate: function apiEvaluate() {
            return page.evaluate.apply(page, Array.prototype.slice.call(arguments));
        },
        injectLocalJs: function () {
            return page.injectJs.apply(page, Array.prototype.slice.call(arguments));
        },
        switchToIframe: function () {
            page.switchToMainFrame();
            page.switchToFrame(0);
        },
        switchToMainFrame: function () {
            page.switchToMainFrame();
        },
        getOptions: function apiGetOptions() {
            return page.options;
        },
        // TODO, make name be an list/array of names - to use same shim.
        wrap: function apiWrap(name) {
            var key;
            // check if already wrapped
            page.switchToMainFrame();
            page.switchToFrame(0);

            name = name.split('.');

            // wrap a global function
            key = page.evaluate(wrapEvaluate, {
                name: name
            });

            // collect result
            return function () {
                return page.evaluate(function (key) {
                    return window.top[key];
                }, key);
            };
        },
        getResultObject: function apiGetResultObject() {
            return result;
        }
    };
};
