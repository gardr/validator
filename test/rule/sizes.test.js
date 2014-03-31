var referee = require('referee');
var assert = referee.assert;
//var refute = referee.refute;
var help = require('../lib/validateHelpers.js');

describe('Sizes validator', function () {

    it('should report on external files', function (done) {
        var harvested = {
            'har': {
                'rawFileDataSummary': {
                    'total': {
                        'redirects': 0,
                        'rawRequests': 4,
                        'requestErrors': 0,
                        'requests': 4,
                        'size': 200,
                        'fullSize': 200
                    },
                    'tips': {
                        'possibleCompressTarget': 81960,
                        'possibleCompressImprovement': 193109,
                        'possibleCompressWithOnlyScriptGzip': 81960
                    },
                    'typed': {
                        'types': {
                            'script': {
                                'http://localhost:8000/fixtures/script1.js': {},
                                'http://localhost:8000/fixtures/script2.js': {},
                                'http://localhost:8000/fixtures/script3.js': {}
                            },
                            'style': {
                                'http://localhost:8000/fixtures/style.css': {}
                            },
                            'image': {},
                            'other': {},
                            'errors': {}
                        }
                    }
                }
            }
        };
        var reporter = help.createReporter.call(this);

        help.callValidator('sizes', harvested, reporter, handler);

        function handler() {
            var report = reporter.getResult();

            assert.equals(report.error.length, 1, 'expect css to generate error');
            assert.equals(report.warn.length, 1, 'expect a external script warning');

            done();
        }

    });

    it('should report on sizes', function (done) {

        var harvested = {
            'har': {
                'rawFileDataSummary': {
                    'total': {
                        'redirects': 0,
                        'rawRequests': 4,
                        'requestErrors': 0,
                        'requests': 4,
                        'size': 99940,
                        'fullSize': 275069
                    },
                    'tips': {
                        'possibleCompressTarget': 81960,
                        'possibleCompressImprovement': 193109,
                        'possibleCompressWithOnlyScriptGzip': 81960
                    }
                }
            }
        };
        var reporter = help.createReporter.call(this);

        help.callValidator('sizes', harvested, reporter, handler);

        function handler() {
            var report = reporter.getResult();

            assert.equals(report.error.length, 0, 'expect 99 kb to not generate an error ');
            assert.equals(report.info.length, 1);
            assert.equals(report.meta.length, 3);

            var data = report.meta[2].data;
            assert.equals(data.threshold, 100000);
            assert.equals(data.restValue, 60);
            assert.equals(data.success, true);

            done();
        }
    });

    it('should report on oversize', function (done) {
        var harvested = {
            'har': {
                'rawFileDataSummary': {
                    'total': {
                        'redirects': 0,
                        'rawRequests': 4,
                        'requestErrors': 0,
                        'requests': 4,
                        'size': 99940,
                        'fullSize': 275069
                    },
                    'tips': {
                        'possibleCompressTarget': 81960,
                        'possibleCompressImprovement': 193109,
                        'possibleCompressWithOnlyScriptGzip': 81960
                    }
                }
            }
        };
        var reporter = help.createReporter.call(this);

        function mutate(context){
            context.thresholdBytes = 50000;
        }

        help.callValidator('sizes', harvested, reporter, handler, mutate);

        function handler() {
            var report = reporter.getResult();

            assert.equals(report.error.length, 1, 'expect 99 kb to generate an error');
            assert.equals(report.info.length, 0);
            assert.equals(report.meta.length, 3);

            var data = report.meta[2].data;
            assert.equals(data.threshold, 50000);
            assert.equals(data.restValue, -49940);
            assert.equals(data.success, false);

            done();
        }

    });

});
