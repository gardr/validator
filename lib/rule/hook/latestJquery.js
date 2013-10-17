module.exports = {
    onResourceReceived: function (arg1, arg2, api) {
        api.wrap('setTimeout', '__setTimeoutCollected');
    },
    onBeforeExit: function (api) {
        var setTimeoutCollected = api.getWrapper('setTimeout');
    }
};
