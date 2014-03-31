var referee = require('referee');
var assert = referee.assert;
//var refute = referee.refute;
var help = require('../lib/validateHelpers.js');

function getFakeRequest(type) {
    return {
        aproxCompressedSize: 2165,
        aproxCompressionPossible: 6213,
        base64Content: '',
        bodyLength: 2165,
        compressed: true,
        contentType: type || 'application/x-javascript',
        redirects: [],
        unzippedSize: 8378,
        url: 'http://...'
    };
}

function getHarvestedData() {
    return {
        'format': {
            id: 'test'
        },
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
                    'summary': {
                        'script': {
                            'total': {
                                'redirects': 1,
                                'rawRequests': 9,
                                'requestErrors': 0,
                                'requests': 10,
                                'size': 75662,
                                'fullSize': 203569
                            },
                            'tips': {
                                'possibleCompressTarget': 74754,
                                'possibleCompressImprovement': 128815,
                                'possibleCompressWithOnlyScriptGzip': 74754
                            }
                        },
                        'style': {
                            'total': {
                                'redirects': 0,
                                'rawRequests': 0,
                                'requestErrors': 0,
                                'requests': 0,
                                'size': 0,
                                'fullSize': 0
                            },
                            'tips': {
                                'possibleCompressTarget': 0,
                                'possibleCompressImprovement': 0,
                                'possibleCompressWithOnlyScriptGzip': 0
                            }
                        },
                        'image': {
                            'total': {
                                'redirects': 0,
                                'rawRequests': 7,
                                'requestErrors': 0,
                                'requests': 7,
                                'size': 83227,
                                'fullSize': 83227
                            },
                            'tips': {
                                'possibleCompressTarget': 82773,
                                'possibleCompressImprovement': 454,
                                'possibleCompressWithOnlyScriptGzip': 83227
                            }
                        },
                        'other': {
                            'total': {
                                'redirects': 0,
                                'rawRequests': 0,
                                'requestErrors': 0,
                                'requests': 0,
                                'size': 0,
                                'fullSize': 0
                            },
                            'tips': {
                                'possibleCompressTarget': 0,
                                'possibleCompressImprovement': 0,
                                'possibleCompressWithOnlyScriptGzip': 0
                            }
                        },
                        'errors': {
                            'total': {
                                'redirects': 0,
                                'rawRequests': 0,
                                'requestErrors': 0,
                                'requests': 0,
                                'size': 0,
                                'fullSize': 0
                            },
                            'tips': {
                                'possibleCompressTarget': 0,
                                'possibleCompressImprovement': 0,
                                'possibleCompressWithOnlyScriptGzip': 0
                            }
                        }
                    },
                    'types': {
                        'script': {
                            'http://localhost:8000/fixtures/script1.js': getFakeRequest(),
                            'http://localhost:8000/fixtures/script2.js': getFakeRequest(),
                            'http://localhost:8000/fixtures/script3.js': getFakeRequest()
                        },
                        'style': {
                            'http://localhost:8000/fixtures/style.css': getFakeRequest('text/css')
                        },
                        'image': {
                            'http://...': getFakeRequest('image/png')
                        },
                        'other': {
                            'http://...': getFakeRequest('text/plain')
                        },
                        'errors': {
                            'http://...': getFakeRequest('text/html')
                        }
                    }
                }
            }
        }
    };
}

describe('Sizes validator', function () {

    it('should report on external files', function (done) {
        var harvested = getHarvestedData();
        var reporter = help.createReporter.call(this);

        help.callValidator('sizes', harvested, reporter, handler);

        function handler() {
            var report = reporter.getResult();

            assert.equals(report.error.length, 1, 'expect css to generate error');
            assert.equals(report.warn.length, 1, 'expect a external script warning');

            done();
        }

    });

    it('should generate error if missing har', function(done){
        var reporter = help.createReporter.call(this);
        help.callValidator('sizes', {har: {}}, reporter, handler);

        function handler() {
            var report = reporter.getResult();

            assert.equals(report.error.length, 1);

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

        function mutate(context) {
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
