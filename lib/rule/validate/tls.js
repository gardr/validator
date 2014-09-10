var internals = {};

internals.validate = function (harvested, report, next, globalOptions) {

    var config = globalOptions.config.har;

    if (config.checkTls !== true){
        return next();
    }

    report.setChecklist('Tls / HTTPS', 'Check if resources are available over TLS');

    function pretty(entry){
        if (entry.errorMessage){
            return entry.url + ' failed with message: ' + entry.errorMessage;
        }
        return entry.url + ' failed with response status code ' + entry.responseCode;
    }

    var har = harvested.har;

    if (har.validTls !== true){


        report[config.errorOnTls ? 'error' : 'warn']('Invalid tls', {list: har.failingUrls && har.failingUrls.map(pretty)});
    }

    report.exitChecklist();
    next();
};

module.exports = {
    dependencies: ['har'],
    validate: internals.validate
};
