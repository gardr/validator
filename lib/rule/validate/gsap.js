var internals = {};

internals.validateLatest = function (harvested, report, next /*, globalOptions*/ ) {
    var jq = harvested.gsap;
    var key = jq.versionObj && jq.versionObj.sortKey;
    var isOk = jq.versions && jq.versions.some(function (o) {
        return key === o.sortKey;
    });

    if (!isOk) {
        var suggestion = jq.versions.map(function (v) {
            return 'v' + [v.major, v.minor, v.patch].join('.');
        }).join(' or ');
        report.error('Wrong GSAP version: ' + jq.version + '. Please use version ' + suggestion);
    } else {
        report.info('Correct GSAP version ' + jq.version);
    }
    report.exitChecklist();
    next();

};

internals.validate = function (harvested, report, next) {
    report.setChecklist('GSAP', 'check if gsap version is valid');

    var data = harvested.gsap;

    if (data && data.versions) {
        internals.validateLatest.apply(this, Array.prototype.slice.call(arguments));
    } else {
        report.exitChecklist();
        next();
    }
};

module.exports = {
    'dependencies': ['gsap'],
    'preprocessors': ['gsap'],
    'validateLatest': internals.validateLatest,
    'validate': internals.validate
};
