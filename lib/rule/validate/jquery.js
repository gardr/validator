var internals = {};

internals.validateLatest = function (harvested, report, next /*, globalOptions*/ ) {
    var jq = harvested.jquery;
    var key = jq.versionObj && jq.versionObj.sortKey;
    var isOk = jq.versions && jq.versions.some(function (o) {
        return key === o.sortKey;
    });

    if (!isOk) {
        var suggestion = jq.versions.map(function (v) {
            return 'v' + [v.major, v.minor, v.patch].join('.');
        }).join(' or ');
        report.error('Wrong jQuery version: ' + jq.version + '. Please use version ' + suggestion);
    } else {
        report.info('Correct jQuery version ' + jq.version);
    }
    report.exitChecklist();
    next();

};

internals.validate = function (harvested, report, next) {
    report.setChecklist('jQuery', 'check if jquery is used and if jquerys apis are misused');

    // validate jquery animate
    var data = harvested.jquery;
    if (data && data.animate && data.animate.length > 0) {
        data.animate.forEach(function (collection) {
            if (collection && collection.length > 0) {
                var trace = collection.map(function (v) {
                    return v.trace;
                });
                report.error('Usage of jquery animate detected, please use CSS animations instead', {
                    'trace': trace
                });
            }
        });
    }

    if (data && data.versions) {
        internals.validateLatest.apply(this, Array.prototype.slice.call(arguments));
    } else {
        report.exitChecklist();
        next();
    }
};

module.exports = {
    'dependencies': ['jquery'],
    'preprocessors': ['jquery'],
    'validateLatest': internals.validateLatest,
    'validate': internals.validate
};
