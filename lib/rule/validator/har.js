/* jshint: */
var createHAR = require('../../createHAR.js');

var version = require('../../../package.json').version;

/*
    request all external contents


    collect sizes, gzip and and without gzip

*/
function getRealResources() {

}

module.exports = {
    validate: function (harvested, report, next) {

        function filterHttp(entry) {
            return entry.request.url.indexOf('http') === 0;
        }

        var input = harvested['harInput'];

        var raw = {
            'resources': input.resources.filter(filterHttp),
            'startTime': input.startTime,
            'endTime':  input.endTime
        };

        harvested.HARFile = createHAR({
            title: 'phantom',
            address: 'pasties-validator-phantomjs',
            creator: {
                name: 'pasties-validator-phantomjs',
                version: version
            }
        }, raw);



        next();
    }
};
