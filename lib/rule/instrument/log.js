module.exports = {
    'onConsoleMessage': function saveLog(msg, lineNum, sourceId, api) {
        var entry = {
            type: 'instrument/log',//:page.onConsoleMessage',
            time: Date.now(),
            message: msg,
            sourceId: sourceId,
            lineNum: lineNum
        };
        api.setPush('logs', entry);
    }
};
