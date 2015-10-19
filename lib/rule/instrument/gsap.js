
function instrumentVersion(){
    if (window.TweenLight) {
        return window.TweenLight.version;
    }
    if (window.TweenMax) {
        return window.TweenMax.version
    }
}

module.exports = {
    'onBeforeExit': function(api){
        api.switchToIframe();
        api.set('version', api.evaluate(instrumentVersion));
    }
};
