module.exports = {
    // 'onPageOpen': function logPageOpen(api) {
    //     var result = api.getResultObject();
    //     result.loadedLog = new Date();
    // },
    'onConsoleMessage': function saveLog(msg, lineNum, sourceId, api) {
        var result = api.getResultObject();
        result.logs.push({
            type: 'hook/log:page.onConsoleMessage',
            time: Date.now(),
            message: msg,
            sourceId: sourceId,
            lineNum: lineNum
        });
    }
};
