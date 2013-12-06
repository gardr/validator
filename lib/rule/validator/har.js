/* jshint: */

var createHAR = require('../../createHAR.js');
var version = require('../../../package.json').version;
var processResources = require('../../processResources.js');


module.exports = {
    validate: function (harvested, report, next) {

        function filterHttp(entry) {
            return entry.request.url.indexOf('http') === 0;
        }

        var input = harvested.harInput;

        var raw = {
            'resources': input.resources.filter(filterHttp),
            'startTime': input.startTime,
            'endTime': input.endTime
        };

        harvested.HARFile = createHAR({
            title: 'phantom',
            address: 'gardr-validator-phantomjs',
            creator: {
                name: 'gardr-validator-phantomjs',
                version: version
            }
        }, raw);

        processResources(harvested, report, next);

    }
};
