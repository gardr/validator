var request = require('request');
var internals = {};

var RE_VERSIONS = /(\d{1,2})\.(\d{1,2})\.?(\d{1,2})?/;

exports.createVersionObj = internals.createVersionObj = function (versionStr) {
    var items = versionStr.match(RE_VERSIONS);
    var res = {
        'major': parseInt(items[1], 10) || 0,
        'minor': parseInt(items[2], 10) || 0,
        'patch': parseInt(items[3], 10) || 0
    };

    res.sortKey = [
        internals.format(res.major),
        internals.format(res.minor),
        internals.format(res.patch)
    ].join('') * 1;
    return res;
};

internals.unique = function (v, i, arr) {
    return arr.lastIndexOf(v) === i;
};

internals.format = function (num) {
    return num > 9 ? '' + num : '0' + num;
};


internals.reverseBySortKey = function (a, b){return a.sortKey < b.sortKey ? 1 : -1;};
internals.orderBySortKey = function (a, b) { return a.sortKey > b.sortKey ? 1 : -1;};

var RE_LETTER = /[a-z]+/gim;
internals.filterTags = function (versionsBack, tags) {
    tags = tags.map(function (o) {
        return o.name;
    })
    .filter(function (name) {
        return !name.match(RE_LETTER); // ignore beta releases etc
    })
    .map(internals.createVersionObj).sort(internals.orderBySortKey);

    // get majors, e.g. [1, 2] because jQuery has dual versions at the moment 20/05/2014
    var major = tags.map(function (v) { return v.major;}).filter(internals.unique);

    // get latest 2 versions from majors
    var correctTags = [];
    major.map(function (version) {
        var matched = 0;
        tags.sort(internals.reverseBySortKey).some(function (o) {
            if (matched < versionsBack && o.major === version) {
                correctTags.push(o);
                matched++;
            }
        });
    });

    return correctTags;
};



exports.createRequestor = function(repo){
    var cached;
    return function requestGithubTags(versionsBack, callback){
        function resolve(data) {
            cached = data;

            if (data) {
                data = internals.filterTags(versionsBack, data);
                //console.log('DATA:', repo, ':', JSON.stringify(data));
            }

            callback(null, data);
        }


        if (cached){
            return resolve(cached);
        }
        var opt =  {'timeout': 5000, 'headers': {'User-Agent': 'gardr/validator-web'}};
        request('https://api.github.com/repos/'+repo+'/tags', opt, function (err, res, body) {
            var data;
            if (!err && body){
                try {
                    data = JSON.parse(body);
                } catch (e) {
                    err = e;
                }
            }

            if (err) {
                return callback(err);
            }

            if (data && data.message && data.message.indexOf('API rate limit exceeded') === 0) {
                console.warn('!internal '+repo+' tags:', data.message);
                return callback(null);
            }

            resolve(data);
        });
    };
}
