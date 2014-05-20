var tool = require('../lib/getLatestJquery.js');

function getLastest(harvested, output, next) {
    var collected = harvested.jquery.version;
    output('versionObj', tool.createVersionObj(collected));

    tool.getLatest(this.versionsBack||2, function (versions) {
        output('versions', versions);
        next();
    });
}

module.exports = {
    dependencies: ['jquery'],
    preprocess: function (harvested, output, next) {
        if (harvested.jquery && harvested.jquery.version) {
            getLastest.apply(this, Array.prototype.slice.call(arguments));
        } else {
            next();
        }
    }
};

