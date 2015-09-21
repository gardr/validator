var childProcess = require('child_process');

var path = require('path');

var phantomjs;
try {
    phantomjs = require('phantomjs2');
} catch(e) {
    phantomjs = require('phantomjs');
}

var main = path.join(__dirname, '.', 'phantom', 'main.js');

module.exports = function (data, handle, done) {
    var merged = JSON.stringify(data);
    var path = process.env.PHANTOMJS_PATH || phantomjs.path;
    childProcess.execFile(path, [main, merged], function (err, stdout/*, stderr*/) {
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
