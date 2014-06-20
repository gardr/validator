/* */

var urlLib = require('url');
var safeURL = require('../../safeURL.js');

module.exports = {
    dependencies: ['har'],
    output: 'security',
    preprocess: function (harvested, output, next, globalOptions, options) {

        if (!options.checkUrl){
            console.log('STOPPING STOPPING STOPPING');
            return next();
        }


        var uniqueList = {};
        function getDomainNames(entry){
            var url;
            try{
                url = urlLib.parse(entry.request.url);
                url = 'http://'+url.hostname;
                if(!uniqueList[url]){
                    //filter out
                    uniqueList[url] = true;
                } else {
                    url = null;
                }
            } catch(e){}
            return url;
        }


        function filterHttp(entry) {
            return entry.request.url.indexOf('http') === 0;
        }


        if (!harvested.har || !harvested.har.input || !harvested.har.input.resources){
            throw new Error('Missing HAR resources');
        }

        var domains = harvested.har.input.resources.filter(filterHttp).map(getDomainNames).filter(Boolean);

        output('domains', domains);

        safeURL(domains, function(err, result){

                if (err){
                    console.log('security.js preprocessor errored', err);
                }

                if (result){
                    output('domainsResult', result);
                }


                next();
        });




    }
};
