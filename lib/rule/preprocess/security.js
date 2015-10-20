/* */

var urlLib = require('url');
var safeURL = require('../../safeURL.js');
var ssllabs = require('node-ssllabs');

var cache = {};
function validateDomainsSsl(domainsList, cb) {
    console.log('validateDomainsSsl', domainsList);
    var res = domainsList.reduce(function(promise, domain, i) {
        return promise.then(function(previous) {
            if (!previous) {
                previous = [];
            }
            return new Promise(function(resolve, reject) {

                if (cache[domain]) {
                    previous.push(cache[domain]);
                    return resolve(cache[domain]);
                }

                //console.log('host'. host);
                ssllabs.scan({
                    host: domain,
                    all: 'done',
                    // ignoreMismatch: true,
                    grade: 'on'
                }, function (err, host) {
                    if (err) {
                        return reject(err);
                    }
                    previous.push(host);
                    cache[domain] = host;
                    resolve(previous);
                });
            })
        });
    }, Promise.resolve());

    return res.then(function(data){
        cb(null, data);
    }, cb);
}

module.exports = {
    dependencies: ['har', 'actions'],
    output: 'security',
    preprocess: function (harvested, output, next, globalOptions, options) {

        if (!options.checkUrl){
            // console.log('STOPPING STOPPING STOPPING');
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


        function getNavigatedDomain(entry) {
            var url;
            try{
                url = urlLib.parse(entry.url);
                url = 'http://'+url.hostname;
                if(!uniqueList[url]){
                    //filter out
                    uniqueList[url] = true;
                    domains.push(url);
                }
            } catch(e){}
        }

        harvested.actions.navigations.forEach(getNavigatedDomain);
        harvested.actions.illegalNavigations.forEach(getNavigatedDomain);

        output('domains', domains);

        var i = 2;
        function done(){
            i--;
            if (i >= 0) {
                return next();
            }
        }

        safeURL(domains, function(err, result){

                if (err){
                    console.log('security.js safeUrl errored', err);
                }

                if (result){
                    output('domainsResult', result);
                }
                done();
        });


        validateDomainsSsl(domains, function(err, result) {

            if (err){
                console.log('security.js validateDomainsSsl errored', err);
            }

            if (result) {
                output('sslReport', result);
            }


            require('fs').writeFileSync('debug_ssl_'+Date.now()+'.json', JSON.stringify(result, null, 4), 'utf8');
            console.log('validateDomainsSsl', err, JSON.stringify(result).length);

            done();

        });
    }
};
