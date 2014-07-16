/* */
var createHAR = require('../../createHAR.js');
var version = require('../../../package.json').version;
var processResources = require('./processResources.js');


function toHar(raw){
    return createHAR({
        title: 'phantom',
        address: 'gardr-validator-phantomjs',
        creator: {
            name: 'gardr-validator-phantomjs',
            version: version
        }
    }, raw);
}

module.exports = {
    dependencies: ['har', 'actions'],
    preprocess: function (harvested, output) {

        function filterHttp(entry) {
            return entry.request.url.indexOf('http') === 0;
        }

        var input = harvested.har.input;

        if (!input || !input.resources){
            throw new Error('Missing HAR resources');
        }

        var resources =  input.resources.filter(filterHttp);

        var raw = {
            'resources': resources,
            'startTime': input.startTime,
            'endTime':   input.endTime
        };

        var harFile = toHar(raw);
        output('har', 'file', harFile);

        processResources.apply(this, Array.prototype.slice.call(arguments));
    }
};
