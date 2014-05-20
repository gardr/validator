var request = require('request');

var internals = {};
var RE_VERSIONS = /(\d{1,2})\.(\d{1,2})\.?(\d{1,2})?/;

internals.createVersionObj = function (versionStr) {
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

var cached;
internals.request = function(callback){
    if (cached){
        return callback(null, cached);
    }
    var opt =  {'timeout': 5000, 'headers': {'User-Agent': 'gardr/validator-web'}};
    request('https://api.github.com/repos/jquery/jquery/tags', opt, function (err, res, body) {
        var data;
        if (!err && body){
            try {
                data = JSON.parse(body);
                cached = data;
            } catch (e) {
                err = e;
            }
        }
        callback(err, data);
    });
};


internals.getLatest = function (versionsBack, cb) {

    if (!cb && typeof versionsBack === 'function'){
        cb = versionsBack;
        versionsBack = 1;
    }

    internals.request(function (err, data) {
        if (err){
            console.log('failed getting tags from jquery', err);
            //log.error('Failed requesting jquery version info form github:', err);
        }
        if (data){
            data = internals.filterTags(versionsBack, data);
        }

        cb(data);
    });
};


module.exports = {
    getLatest: internals.getLatest,
    createVersionObj: internals.createVersionObj
};
