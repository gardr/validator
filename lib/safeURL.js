var API_KEY = 'ABQIAAAA2-mVPm5uktwH2gVnBNH-hRS06DhAuAn80Gvr-piHpiKvdnGLjA';

var sb = require('safe-browse');
var api = new sb.Api(API_KEY, {});

var internals = {};

internals.cache = {};

internals.lookupCache = function (urls){
    var unresolved = [];
    var result = {};

    urls.forEach(function(v){
        if (internals.cache[v]){
            result[v] = internals.cache[v];
        } else {
            unresolved.push(v);
        }
    });

    return {
        'input': urls,
        'unresolved': unresolved,
        'result': result
    };
};

internals.setCache = function (data){
    Object.keys(data).forEach(function(key){
        internals.cache[key] = data[key];
    });
};


internals.lookup = function (urls, cb) {
    if (typeof urls === 'string'){
        urls = [urls];
    }
    var maxLoops = 5;

    function loop(){
        var state = internals.lookupCache(urls);

        maxLoops--;

        if (maxLoops <= 0){
            cb(new Error('Failed fetching urls'));
        } else if (state.unresolved.length === 0){
            cb(null, state.result);
        } else {
            api.lookup(state.unresolved, function(err, data){
                // console.log('looked up', err, data);
                if (!err && data){
                    internals.setCache(data.data);
                }
                loop();
            });
        }
    }

    loop();
};

module.exports = internals.lookup;
