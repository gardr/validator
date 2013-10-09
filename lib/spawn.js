var path = require('path');
var spawn = require('shellout');
var PHANTOM_BIN_PATH = path.join(__dirname, '..', 'node_modules', 'phantomjs', 'bin', 'phantomjs');
var phantom_options = '';
var phantom_runner = path.join('.', 'phantom', 'runner.js');

module.exports = function (options, callback) {
    spawn(PHANTOM_BIN_PATH, [phantom_runner, JSON.stringify(options), phantom_options], callback);
};
