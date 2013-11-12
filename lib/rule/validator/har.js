var createHAR = require('../../createHAR.js');

var version = require('../../../package.json').version;

module.exports = {
    validate: function (harvested, report, next) {

        harvested.har_file = createHAR({
            title: 'phantom',
            address: 'pasties-validator-phantomjs',
            creator: {
                name: 'pasties-validator-phantomjs',
                version: version
            }
        }, harvested.har_input);
        next();
    }
};
