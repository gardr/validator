var sb = require('safe-browse');

var internals = {};

var ENV_KEY = 'GOOG_SAFE_BROWSE_API_KEY';
internals.create = function(){
    if (internals.api){
        return;
    }
    var apiKey = process.env[ENV_KEY];
    // using a key fallback for tests
    internals.api = new sb.Api(apiKey||'_missing_key_', {});
};

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
    internals.create();
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
            internals.api.lookup(state.unresolved, function(err, data){
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
