var hoek = require('hoek');
var path = require('path');
var spawn = require('shellout');

var phantomjs = require('phantomjs');

var PHANTOM_BIN_PATH = phantomjs.path;//path.join(__dirname, '..', 'node_modules', '.bin', 'phantomjs');
var PHANTOM_OPTIONS = '';
var PHANTOM_RUNNER = path.join(__dirname, '.', 'phantom', 'main.js');
var defaults = require('./phantom/defaults.js');

module.exports = function (options, handle, done) {
    var merged = hoek.applyToDefaults(defaults, options);
    merged = JSON.stringify(merged);

    spawn(PHANTOM_BIN_PATH, [PHANTOM_RUNNER, merged, PHANTOM_OPTIONS], function (stderr, stdout) {
        if (typeof stdout === 'undefined'){
            console.log('PHANTOM_BIN_PATH', PHANTOM_BIN_PATH);
            console.log('PHANTOM_RUNNER', PHANTOM_RUNNER);
            console.log('merged', merged);
            console.log('PHANTOM_OPTIONS', PHANTOM_OPTIONS);
            console.log('stderr:', stderr, 'stdout:', stdout);
        }
        if (stderr && !stdout){
            // ignore errors/warnings, but log them out for now?.
            console.log('\nstderr:', stderr.toString());
        }

        // errors inside phantomrunner will print to stdout
        if (false && stdout){
            if (Buffer.isBuffer(stdout)){
                try{
                    console.log('\nstdout.JSON: ', JSON.parse(stdout.toString(), null, 4));
                } catch(e){
                    console.log('\nstdout: ', stdout.toString());
                }

            } else if (typeof stdout === 'string'){
                console.log('\nstdout.toString(): ', stdout);
            } else {
                console.log('\nstdout.toJSON(): ', JSON.stringify(stdout, null, 4));
            }
        }

        // TODO, erros doesnt work well atm
        handle(stdout, done);
    });
};
