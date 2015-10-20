var getGithubTags = require('./getGithubTags.js');

var internals = {};

internals.request = getGithubTags.createRequestor('greensock/GreenSock-JS');

internals.getLatest = function (versionsBack, cb) {

    if (!cb && typeof versionsBack === 'function'){
        cb = versionsBack;
        versionsBack = 1;
    }

    internals.request(versionsBack, function (err, data) {
        if (err){
            console.log('!internal - failed getting tags from gsap', err);
        }
        cb(data);
    });
};


module.exports = {
    getLatest: internals.getLatest,
    createVersionObj: getGithubTags.createVersionObj
};
