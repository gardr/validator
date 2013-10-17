var request = require('request');
var readline = require('readline');

function getLatest(cb) {
    var cbCalled = false;
    var stream = request('http://code.jquery.com/jquery-latest.min.js');

    var rl = readline.createInterface({
        input: stream,
        terminal: false
    });

    var RE_JQ_VER = /jQuery v(\d+\.\d+\.\d+)/i;

    rl.on('line', function (line) {
        if (cbCalled) return;

        var match = line.match(RE_JQ_VER);
        if (match && match[1]) {
            cb(match[1]);
        }

        stream.end();
        rl.close();

    });
};

module.exports = {
    validate: function (harvested, report, next) {
        // validate that jq is within latest
        getLatest(function(versionString){

        });
    }
};
