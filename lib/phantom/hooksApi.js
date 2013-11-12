var wrap = require('./wrap.js');

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
        wrap: wrap.createWrap(page),
        getResultObject: function() {
            return result;
        }
    };
};
