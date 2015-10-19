var getGithubTags = require('./getGithubTags.js');

var internals = {};

internals.request = getGithubTags.createRequestor('greensock/GreenSock-JS');

internals.getLatest = function (versionsBack, cb) {

    if (!cb && typeof versionsBack === 'function'){
        cb = versionsBack;
        versionsBack = 1;
    }

    internals.request(function (err, data) {
        if (err){
            console.log('!internal - failed getting tags from gsap', err);
            //log.error('Failed requesting jquery version info form github:', err);
        }
        if (data){
            if (data.message && data.message.indexOf('API rate limit exceeded') === 0) {
                return cb(null);
            }
            data = getGithubTags.filterTags(versionsBack, data);
        }

        cb(data);
    });
};


module.exports = {
    getLatest: internals.getLatest,
    createVersionObj: getGithubTags.createVersionObj
};
