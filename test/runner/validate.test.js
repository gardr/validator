var path = require('path');
var buster = require('buster-assertions');
var assert = buster.assert;
var refute = buster.refute;
var helpers = require('../../lib/helpers.js');
var validate = require('../../lib/validate.js').validate;

var VALIDATOR_PATH_1 = path.resolve(path.join(__dirname, 'fixtures', 'customvalidator', 'validator1.js'));
var VALIDATOR_PATH_2 = path.resolve(path.join(__dirname, 'fixtures', 'customvalidator', 'validator2.js'));

describe('Validate', function () {
    var files = helpers.collectValidator({
        val1: VALIDATOR_PATH_1,
        val2: VALIDATOR_PATH_2
    });

    it('should run a set of validators on probed data', function (done) {

        assert.equals(files.length, 2);
        assert.equals(files[0], VALIDATOR_PATH_1);
        assert.equals(files[1], VALIDATOR_PATH_2);

        validate({logs: []}, {validatorFiles: files}, function(err, harvested, report){
            refute(err);
            assert.isObject(report);
            assert.equals(report.info.length, 1);
            assert.equals(report.debug.length, 1);
            assert.equals(report.warn.length, 1);
            assert.equals(report.error.length, 1);
            done();
        });

    });

});
