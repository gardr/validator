var internals = {};

internals.mapReadable = function (entry){
    if (entry.errorMessage){
        return entry.url + ' failed with message: ' + entry.errorMessage;
    }
    return entry.url + ' failed with response status code ' + entry.responseCode;
};

internals.validate = function (harvested, report, next, globalOptions) {

    var config = globalOptions.config.har;

    if (config.forceSecureUrls && harvested.har && harvested.har.banner && harvested.har.banner.rawFileData) {
        report.setChecklist('HTTPS', 'Check that resources are linked with https');

        var result = Object.keys(harvested.har.banner.rawFileData).filter(function(url){
            if (url.indexOf(globalOptions.resourceDomainBase) === 0) {
                return false;
            }
            if (url.indexOf('https') !== 0) {
                return true;
            }
        });

        if (result.length > 0) {
            report.error('Found resources without HTTPS', {list: result});
        } else {
            report.info('All resources linked with https correctly');
        }

        report.exitChecklist();
    }

    if (config.checkTls !== true){
        return next();
    }

    report.setChecklist('TLS', 'Check if resources are available over TLS');

    var har = harvested.har;

    if (har.validTls !== true){
        var info;

        if (har.failingUrls && har.failingUrls.length > 0){
            info = {
                list: har.failingUrls && har.failingUrls.map(internals.mapReadable)
            };
        }
        report[config.errorOnTls ? 'error' : 'warn']('Missing TLS / HTTPS support for resources', info);
    } else {
        report.info('All resources supports TLS');
    }

    report.exitChecklist();
    next();
};

module.exports = {
    dependencies: ['har'],
    validate: internals.validate
};
