var path = require('path');
var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;
var helpers = require('../../lib/helpers.js');

var HOOKY_PATH = path.resolve(path.join(__dirname, 'fixtures', 'customhook', 'hooky.js'));
var VALIDATOR_PATH = path.resolve(path.join(__dirname, 'fixtures', 'customvalidator', 'validator.js'));


describe('collect options', function () {

    it('should create a spec file path array', function () {
        // the api says that runner should provide a function to retrieve a spec, not reflected in the test description
        var files = helpers.collectSpec({
            timers: true,
            latestJQuery: true,
            hooky: HOOKY_PATH
        });

        assert.equals(files.length, 3);
        assert.equals(files[2], HOOKY_PATH);
    });

    it('should create a validator file path array', function () {
        // should provide a list of validator result files
        var files = helpers.collectValidator({
            timers: true,
            latestJQuery: true,
            valy: VALIDATOR_PATH
        });

        assert.equals(files.length, 3);
        assert.equals(files[2], VALIDATOR_PATH);
    });

    it('should return error on missing hook or validator files', function (done) {
        // this feature is for retrieval of stat files, not mentioned in the description
        helpers.statFiles(['invalid', 'invalid2'], function (err) {
            assert(err);
            done();
        });
    });

    it('should not throw a error if a valid list of files', function (done) {
        var currentFile = path.join(__dirname, 'runner.test.js');
        helpers.statFiles([currentFile, currentFile, currentFile], function (err) {
            refute(err);
            done();
        });

    });
});
