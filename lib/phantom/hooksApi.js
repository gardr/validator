var wrap = require('./wrap.js');

module.exports = function (phantom, page, result) {
    return {
        evaluate: function apiEvaluate() {
            return page.evaluate.apply(page, Array.prototype.slice.call(arguments));
        },
        injectLocalJs: function () {
            return page.injectJs.apply(page, Array.prototype.slice.call(arguments));
        },
        /*includeJs: function(){
            return page.includeJs.apply(page, Array.prototype.slice.call(arguments));
        },*/
        getPNG: function(){
            return page.renderBase64('PNG');
        },
        getViewportSize: function(){
            return page.viewportSize;
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
