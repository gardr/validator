/* */
var createHAR = require('../../createHAR.js');
var version = require('../../../package.json').version;
var processResources = require('./processResources.js');

module.exports = {
    dependencies: ['har'],
    preprocess: function (harvested, output) {

        function filterHttp(entry) {
            return entry.request.url.indexOf('http') === 0;
        }

        var input = harvested.har.input;

        if (!input || !input.resources){
            throw new Error('Missing HAR resources');
        }

        var raw = {
            'resources': input.resources.filter(filterHttp),
            'startTime': input.startTime
        };

        var harFile = createHAR({
            title: 'phantom',
            address: 'gardr-validator-phantomjs',
            creator: {
                name: 'gardr-validator-phantomjs',
                version: version
            }
        }, raw);

        output('har', 'file', harFile);

        processResources.apply(this, Array.prototype.slice.call(arguments));
    }
};
