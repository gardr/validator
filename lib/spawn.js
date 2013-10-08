var path = require('path');
var spawn = require('shellout');
var PHANTOM_BIN_PATH = path.join(__dirname, '..', 'node_modules', 'phantomjs', 'bin', 'phantomjs');

module.exports = function (options, callback) {
    //spawn(PHANTOM_BIN_PATH)
    console.log('original');
};
