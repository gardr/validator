var path = require('path');
var buster = require('referee');
var assert = buster.assert;
var refute = buster.refute;
var helpers = require('../../lib/helpers.js');
var validatorLib = require('../../lib/validate.js');
var validate = validatorLib.validate;

//var CUSTOM_HOOK_PATH = path.resolve(path.join(__dirname, 'fixtures', 'customhook', 'hooky.js'));
var VALIDATOR_PATH_1 = path.resolve(path.join(__dirname, 'fixtures', 'customvalidator', 'validator1.js'));
var VALIDATOR_PATH_2 = path.resolve(path.join(__dirname, 'fixtures', 'customvalidator', 'validator2.js'));

describe('Validate', function () {
    var files = helpers.collectValidator([
        {name: 'validator1', path: VALIDATOR_PATH_1},
        {name: 'validator2', path: VALIDATOR_PATH_2}
    ]);

    it('should throw when missing validators', function(){
        assert.exception(function(){
            validate();
        });


        assert.exception(function(){
            validate({}, [], function(){});
        });
    });

    it('should throw on missing validator', function(){
        var invalidFiles = ['INVALID_PATH'];

        validate({}, {validate: invalidFiles}, function(err){
            assert(err);
        });
    });

    it('should not require objects, but return error on missing validate function', function(done){
        var options = {
            validate: ['INVALID_MODULE']
        };
        validate({}, options, function(err){
            assert(err);
            done();
        });
    });

    it('should run a set of validators on probed data', function (done) {

        assert.equals(files.length, 2);
        assert.equals(files[0].path, VALIDATOR_PATH_1);
        assert.equals(files[1].path, VALIDATOR_PATH_2);

        var harvested = {
            'common': {
                'logs': []
            },
            'hooky': {},
            'hooky2': {}
        };

        var options = {
            'validate': files,
            config: {}
        };

        validate(harvested, options, function (err, harvested, report) {
            refute(err);
            assert.isObject(report);
            assert.equals(report.info.length, 1);
            assert.equals(report.debug.length, 1);
            assert.equals(report.warn.length, 1);
            assert.equals(report.error.length, 1);
            done();
        });

    });

    it('should only provide depedencies properties from hasvested data to validation function', function (done) {

        var data = {
            'custom': {
                'data': 1
            },
            'common': {},
            'filterOut': true
        };
        var validators = {
            'config': {},
            'instrument': [{name: 'custom'}],
            'validate': [{
                'validate': function (harvested, report, next) {
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
            'hooky': {},
            'filterOut': true
        };
        var called = 0;

        var options = {
            'config': {},
            'instrument': [
                {name: 'custom'}
            ],
            'validate': [{
                name: 'validate1',
                path: VALIDATOR_PATH_1
            }],
            'preprocess': [{
                preprocess: function (harvested, output, next) {
                    called++;
                    output('custom', 'key', 'value');
                    output('key2', 'value2');
                    refute(harvested.filterOut, 'should only provide dependencies');
                    assert.equals(harvested.custom.data, data.custom.data);
                    next();
                },
                dependencies: ['custom'],
                name: 'custom'
            }]
        };

        validate(data, options, function(err, harvested){
            refute(err);
            assert.equals(called, 1, 'expect preprocessors to be called 1 time');
            assert.equals(harvested.custom.key, 'value');
            assert.equals(harvested.custom.key2, 'value2');
            done();
        });

    });

    it('should error if trying to output on non-key-dependcies', function(){

        var data = {
            'common': {}
        };

        var options = {
            'config': {},
            'validate': [],
            'preprocess': [{
                preprocess: function (harvested, output, next) {
                    output('custom', 'key', 'value');
                    next();
                },
                dependencies: [],
                name: 'preprocessY'
            }]
        };

        validate(data, options, function(err){
            assert(err, 'should return an error');
            assert.isObject(err, 'error should be a object');
        });
    });

    describe('Reporthelpers', function(){
        var reportKeys = ['info', 'debug', 'warn', 'error'];
        it('should provide report fn', function(){
            var result = {};
            var reporter = validatorLib.createReportHelper(result)('test');

            reportKeys.forEach(function(key){
                reporter[key](key+'Message');
            });

            var _result = reporter.getResult();
            assert.equals(_result, result);

            reportKeys.forEach(function(key){
                assert(_result[key]);
            });

        });

        function createEntry(a, b){
            return {
                file: a||'filename1',
                sourceURL: b||'sourceurl1',
                line: 1
            };
        }

        it('should fix trace data and remove duplicates', function(){
            var result = {};
            var reporter = validatorLib.createReportHelper(result)('test');

            var longSourceUrl = 'very_very_very_long_very_long_very_long_url_and?some_arg';
            var trunc = 'very_very_very_long_very_';
            var trace = [
                createEntry(),
                createEntry('a'),
                createEntry(),
                createEntry('b', longSourceUrl),
                createEntry(),
                createEntry(),
                createEntry(),
                createEntry()
            ];
            reporter.info('msg', {trace: trace});
            var _result = reporter.getResult();
            //console.log(_result.info[0].data.trace);
            assert.equals(_result.info.length, 1);
            assert.equals(_result.info[0].data.trace.length, 3);
            refute.equals(_result.info[0].data.trace[2].file, 'b');
            assert.equals(_result.info[0].data.trace[2].file, trunc);
        });

        it('sending in a trace object should wrap in array', function(){
            var reporter = validatorLib.createReportHelper({})('test');

            reporter.info('msg', {trace: {sourceURL: '....'}});

            assert(reporter.getResult().info[0].data.trace.length, 1);

        });
    });

    describe('filterDataByDependencies', function () {
        it('should throw if attempts to change current object', function () {

            var input = {
                common: {deep: {inner: {}}}
            };

            var o = validatorLib.filterDataByDependencies(input, ['dep'], 'test');

            assert(Object.isFrozen(o));
            assert.exception(function () {
                'use strict';
                o.key2 = 'value2';
                o.common.deep.inner.key3 = 'value3';
            });
            refute.equals(o.key2, 'value2');
            refute.equals(o.common.deep.inner.key3, 'value3');
        });

        it('deepFreeze should not try to freeze nonobjects', function(){
            var i = 123;
            assert.exception(function(){
                validatorLib.deepFreeze(i);
            });

        });

        it('should default to common if missing dependencies', function(){
            var o = validatorLib.filterDataByDependencies({common: {}}, null, 'test');
            assert(Object.isFrozen(o));
            assert(o.common);
        });

        it('should emit warnings when missing dependency data', function(done){
            var _warn = global.console.warn;
            global.console.warn = function(){
                global.console.warn = _warn;
                assert(true);
                done();
            };
            validatorLib.filterDataByDependencies({}, ['missing'], 'not_named_test');
        });

        it('should provide empty object if no data collected to avoid deep if-expressions', function(){

            var o = validatorLib.filterDataByDependencies({common: {}}, ['dep1', 'dep2'], 'test');

            assert.isObject(o.dep1);
            assert.isObject(o.dep2);
            assert.isObject(o.common);
        });
    });
});
