module.exports = {
    // waitsForDone: true injects done, waitsForDone: 10000
    onLoadStarted: function (arg1, arg2, api/*, done*/) {
        //api.wrap('setTimeout', '__setTimeoutCollected');
        //setTimeout(done, 1000);
    },
    onBeforeExit: function (api) {
        //var setTimeoutCollected = api.getWrapper('setTimeout');
        api.getResultObject().__setTimeoutCollected = true;
    }
};
