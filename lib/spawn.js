var childProcess = require('child_process');

var hoek = require('hoek');
var path = require('path');

var phantomjs = require('phantomjs');

//var options = '';
var main = path.join(__dirname, '.', 'phantom', 'main.js');
var defaults = require('./phantom/defaults.js');

module.exports = function (options, handle, done) {
    var merged = hoek.applyToDefaults(defaults, options);

    merged = JSON.stringify(merged);

    childProcess.execFile(phantomjs.path, [main, merged, options], function (err, stdout/*, stderr*/) {
        if (err) {
            handle(stdout, done, err);
        } else if (typeof stdout !== 'undefined'){
            handle(stdout, done);
        } else {
            done(err);
        }
    });
};

// function debug(err, stdout, stderr) {
//     if (typeof stdout === 'undefined') {
//         console.log('phantomjs.path', phantomjs.path);
//         console.log('main', main);
//         console.log('options', options);
//         console.log('stderr:', stderr, 'stdout:', stdout);
//     }
//     if (stderr) {
//         // ignore errors/warnings, but log them out for now?.
//         console.log('\nstderr:', stderr.toString());
//     }

//     // errors inside phantomrunner will print to stdout
//     if (false && stdout) {
//         if (Buffer.isBuffer(stdout)) {
//             try {
//                 console.log('\nstdout.JSON: ', JSON.parse(stdout.toString(), null, 4));
//             } catch (e) {
//                 console.log('\nstdout: ', stdout.toString());
//             }

//         } else if (typeof stdout === 'string') {
//             console.log('\nstdout.toString(): ', stdout);
//         } else {
//             console.log('\nstdout.toJSON(): ', JSON.stringify(stdout, null, 4));
//         }
//     }
// }
