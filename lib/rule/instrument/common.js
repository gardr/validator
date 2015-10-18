module.exports = {
    'name': 'common',
    'defaults': function(){
        return {
            errors: []
        };
    },
    'onError': function (msg, trace, api) {
        api.setPush('errors', {
            type: 'instrument/error::page.onError',
            date: Date.now(),
            message: msg,
            trace: trace.map(function (entry) {
                return {
                    line: entry.line,
                    sourceURL: entry.file,
                    'function': entry['function']
                };
            })
        });

        return true;
    }
};
