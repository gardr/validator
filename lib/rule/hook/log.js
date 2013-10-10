var getSource = require('../../phantom/getSource.js');

module.exports = {
    'onConsoleMessage': function (msg, lineNum, sourceId, api) {
        var result = api.getResultObject();
        result.log = result.log || [];
        result.log.push({
            message: msg,
            from: getSource()
        });
    },
    'onOpen': function(api){
        var result = api.getResultObject();
        //result.opened = true;
    },
    'onBeforeExit': function(api){
        var result = api.getResultObject();
        //result.registered = true;
    }
};
