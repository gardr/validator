var hoek = require('hoek');
var path = require('path');
var spawn = require('shellout');
var PHANTOM_BIN_PATH = path.join(__dirname, '..', 'node_modules', 'phantomjs', 'bin', 'phantomjs');
var PHANTOM_OPTIONS = '';
var PHANTOM_RUNNER = path.join(__dirname, '.', 'phantom', 'runner.js');
var defaults = require('./phantom/defaults.js');

module.exports = function (options, handle, done) {
    var merged = JSON.stringify(hoek.applyToDefaults(defaults, options));
    spawn(PHANTOM_BIN_PATH, [PHANTOM_RUNNER, merged, PHANTOM_OPTIONS], function (stderr, stdout) {
        if (stderr){
            // ignore errors/warnings, but log them out for now?.
            //console.log('stderr:', stderr.toString());
        }
        // errors inside phantomrunner will print to stdout
        //console.log('stdout:', stdout && stdout.toString());
        handle(stdout, done);
    });
};
