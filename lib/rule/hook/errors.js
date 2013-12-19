module.exports = {
    'name': 'common',
    'onError': function (msg, trace, api) {
        api.setPush('errors', {
            type: 'hook/error::page.onError',
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
