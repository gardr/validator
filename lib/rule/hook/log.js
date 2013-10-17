module.exports = {
    'onConsoleMessage': function saveLog(msg, lineNum, sourceId, api) {
        var result = api.getResultObject();
        result.log = result.log || [];
        result.log.push({
            time: Date.now(),
            message: msg
        });
    }
};
