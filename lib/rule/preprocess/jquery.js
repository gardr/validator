var tool = require('../lib/getLatestJquery.js');

function getLastest(harvested, output, next/*, options, config*/) {
    var collected = harvested.jquery.version;
    output('versionObj', tool.createVersionObj(collected));

    tool.getLatest(function (versions) {
        output('versions', versions);
        next();
    });
}

module.exports = {
    dependencies: ['jquery'],
    preprocess: function (harvested, output, next) {
        if (harvested.jquery.version) {
            getLastest.apply(this, Array.prototype.slice.call(arguments));
        } else {
            next();
        }
    }
};

