var hoek = require('hoek');
var path = require('path');
var spawn = require('shellout');

var PHANTOM_BIN_PATH = path.join(__dirname, '..', 'node_modules', 'phantomjs', 'bin', 'phantomjs');
if (process.env.PHANTOM_JS_BIN_PATH){
    PHANTOM_BIN_PATH = process.env.PHANTOM_JS_BIN_PATH;
}

var PHANTOM_OPTIONS = '';
var PHANTOM_RUNNER = path.join(__dirname, '.', 'phantom', 'main.js');
var defaults = require('./phantom/defaults.js');

module.exports = function (options, handle, done) {
    var merged = hoek.applyToDefaults(defaults, options);
    merged = JSON.stringify(merged);

    spawn(PHANTOM_BIN_PATH, [PHANTOM_RUNNER, merged, PHANTOM_OPTIONS], function (stderr, stdout) {
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
