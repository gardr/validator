var state = {
    resources: [],
    startTime: null,
    endTime: null
};

module.exports = {
    onLoadStarted: function () {
        state.startTime = new Date();
    },
    onResourceRequested: function (requestData) {
        if (!requestData) {
            return;
        }
        state.resources[requestData.id-1] = {
            request: requestData,
            startReply: null,
            endReply: null
        };
    },
    onResourceReceived: function (res) {
        state.resources[res.id-1][res.stage + 'Reply'] = res;
    },
    onPageOpen: function () {
        state.endTime = new Date();
    },
    onBeforeExit: function (api) {
        api.set('input', state);
    }
};
