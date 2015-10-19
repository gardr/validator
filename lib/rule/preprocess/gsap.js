var tool = require('../lib/getLatestGsap.js');

function getLastest(harvested, output, next) {
    var collected = harvested.gsap.version;
    output('versionObj', tool.createVersionObj(collected));

    tool.getLatest(this.versionsBack||2, function (versions) {
        output('versions', versions);
        next();
    });
}

module.exports = {
    dependencies: ['gsap'],
    preprocess: function (harvested, output, next) {
        if (harvested.gsap && harvested.gsap.version) {
            getLastest.apply(this, Array.prototype.slice.call(arguments));
        } else {
            next();
        }
    }
};
