var hoek = require('hoek');
var path = require('path');
var spawn = require('shellout');
var PHANTOM_BIN_PATH = path.join(__dirname, '..', 'node_modules', 'phantomjs', 'bin', 'phantomjs');
var phantom_options = '';
var phantom_runner = path.join('.', 'phantom', 'runner.js');
var defaults = require('./phantom/defaults.js');

module.exports = function (options, callback) {
    var merged = JSON.stringify(hoek.applyToDefaults(defaults, options));
    spawn(PHANTOM_BIN_PATH, [phantom_runner, merged, phantom_options], callback);
};
