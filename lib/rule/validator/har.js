var createHAR = require('../../createHAR.js');

var version = require('../../../package.json').version;

module.exports = {
    validate: function (harvested, report, next) {
        harvested.har = createHAR({
            title: 'phantom',
            address: '...',
            creator: {
                name: 'pasties-validator-phantomjs',
                version: version
            }
        }, harvested.harInput);
        next();
    }
};
