var path = require('path');
var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;
var helpers = require('../../lib/helpers.js');
var validatorLib = require('../../lib/validate.js');
var validate = validatorLib.validate;

var VALIDATOR_PATH_1 = path.resolve(path.join(__dirname, 'fixtures', 'customvalidator', 'validator1.js'));
var VALIDATOR_PATH_2 = path.resolve(path.join(__dirname, 'fixtures', 'customvalidator', 'validator2.js'));

describe('Validate', function () {
    var files = helpers.collectValidator({
        'val1': VALIDATOR_PATH_1,
        'val2': VALIDATOR_PATH_2
    });

    it('should run a set of validators on probed data', function (done) {

        assert.equals(files.length, 2);
        assert.equals(files[0], VALIDATOR_PATH_1);
        assert.equals(files[1], VALIDATOR_PATH_2);

        var harvested = {
            'common': {
                'logs': []
            },
            'hooky': {},
            'hooky2': {}
        };

        validate(harvested, {
            validatorFiles: files
        }, function (err, harvested, report) {
            refute(err);
            assert.isObject(report);
            assert.equals(report.info.length, 1);
            assert.equals(report.debug.length, 1);
            assert.equals(report.warn.length, 1);
            assert.equals(report.error.length, 1);
            done();
        });

    });

    it('should only provide depedencies', function (done) {

        var data = {
            'custom': {
                'data': 1
            },
            'common': {},
            'filterOut': true
        };
        var validators = {
            'validatorFiles': [{
                validate: function (harvested, report, next) {
                    refute(harvested.filterOut, 'should only provide dependencies');
                    assert.equals(harvested.custom.data, data.custom.data);
                    next();
                },
                dependencies: ['custom'],
                name: 'validatorx'
            }]
        };

        validate(data, validators, done);
    });

    it('should run preprocessors', function(done){

        var data = {
            'custom': {
                'data': 1
            },
            'common': {},
            'filterOut': true
        };
        var called = 0;

        var options = {
            'validatorFiles': [],
            'preprocessorFiles': [{
                preprocess: function (harvested, output, next) {
                    called++;
                    output('custom', 'key', 'value');
                    output('key2', 'value2');
                    refute(harvested.filterOut, 'should only provide dependencies');
                    assert.equals(harvested.custom.data, data.custom.data);
                    next();
                },
                dependencies: ['custom'],
                name: 'preprocessX'
            }]
        };

        validate(data, options, function(err, harvested){
            assert.equals(called, 1, 'expect preprocessors to be called 1 time');
            assert.equals(harvested.custom.key, 'value');
            assert.equals(harvested.custom.key2, 'value2');
            done();
        });

    });

    describe('filterDataByDependencies', function () {
        it('should throw if attempts to change current object', function () {

            var input = {
                common: {}
            };

            var o = validatorLib.filterDataByDependencies(input, [], 'test');

            assert(Object.isFrozen(o));
            assert.exception(function () {
                'use strict';
                o.key2 = 'value2';
            });
            refute.equals(o.key2, 'value2');
        });

        it('should provide empty object if no data collected to avoid deep if expressions', function(){

            var o = validatorLib.filterDataByDependencies({common: {}}, ['dep1', 'dep2'], 'test');

            assert.isObject(o.dep1);
            assert.isObject(o.dep2);
            assert.isObject(o.common);
        });
    });
});
