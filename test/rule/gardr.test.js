var referee = require('referee');
var assert = referee.assert;
var help = require('../lib/validateHelpers.js');

var instrumentation = require('../../lib/rule/instrument/gardr.js');

function noop(){}

describe('Gardr instrumentation', function () {

    it('should store probes', function (done) {

        var api = help.createApi({'onCustomEvent': noop});

        global.window = {
            'initManager': api.call,
            '__manager': {}
        };

        instrumentation.onPageOpen(api.api);

        global.window = null;

        assert.equals(api.calls, 2);
        assert(api.lastOptionsArg, 'should have collected initManager argument');
        assert.equals(api.lastOptionsArg, JSON.stringify(api.options));

        done();
    });


    function toElem(n){
        n = n.split('#');
        return {'tagName': n[0], 'id': n[1], getAttribute: function(){}};
    }

    function createRoot(input){
        return {'children': input.map(toElem), getAttribute: function(){}};
    }

    [ createRoot(['style', 'script', 'div#correct', 'div']),
      createRoot(['style', 'script', 'a#correct', 'div']),
      createRoot(['style', 'script', 'noscript', 'meta', 'link', 'div#correct']),
      createRoot(['a#correct', 'span']),
      createRoot(['span#correct']),
      createRoot(['div#correct', 'div', 'div']),
      createRoot(['html', 'body', 'div#correct', 'img'])
    ].forEach(generateTest);

    function generateTest(rootElem, index){
        it('should select correct elements list index '+index, function(done){
            var api = help.createApi();

            global.document = {
                'getElementById': function(){
                    return rootElem;
                }
            };
            global.window = {
                '__manager': {
                    _get: function(){
                        return [{getData: noop}];
                    }
                },
                'initManager': api.call,
                'getComputedStyle': function(){
                    return {
                        'getPropertyValue':noop
                    };
                }
            };

            instrumentation.onBeforeExit(api.api, {});

            // console.log('DATA:', );

            assert.equals(api.calls, 2);
            assert.equals(api.otherCalls.switch, 3);

            var data = api.result[api.options.key].dom.banner;

            assert.equals(data.id, 'correct');


            global.window = null;
            global.document = null;
            done();
        });
    }


    it('should collect css and dom data', function(){
        global.document = {
            createElement: function(){
                return {
                    appendChild: function(){}
                };
            },
            querySelectorAll: function(){
                return [{
                    cloneNode: function(){},
                    innerHTML: '<div></div>'
                }];
            },
            querySelector: function(){
                return {
                    onclick: function(){}
                };
            },
            getElementById: function(){
                return {
                    querySelector : function(){
                        return {

                        };
                    }
                };
            }
        };
        global.window = {
            getComputedStyle: function(){
                return {
                    getPropertyValue : function(){
                        return {

                        };
                    }
                };
            },
            __manager: {
                _get: function(/*name*/){
                    return [{
                        options: {
                            url: 'a'
                        },
                        getData: function(){
                            return 'b';
                        }
                    }];
                }
            }
        };

        var api = help.createApi();

        instrumentation.onBeforeExit(api.api, help.config.config.gardr);

        assert.equals(api.calls, 2);
    });
});


describe('Gardr validator', function () {

    it('should evaluate and return errors', function (done) {
        var harvest = {
            'gardr': {
                'data': {
                    'frameInput': {
                        'height': 225,
                        'minSize': 39,
                        'name': 'phantom',
                        'timeout': 200,
                        'url': '...',
                        'width': 980
                    },
                    'rendered': {
                        'height': 222,
                        'width': 980
                    }
                },
                'dom': {
                    banner: {
                        name: 'DIV',
                        clickHandler: '',
                        found: true,
                        css: {
                            position: 'absolute',
                            height: '222px',
                            display: 'block',
                            width: '980px'
                        }
                    },
                    wrapper: {
                        css: {
                            position: 'relative',
                            visability: ''
                        }
                    }
                }
            },
            'actions': {
                navigations: [],
                illegalNavigations: [],
                windowOpened: []
            }
        };

        var reporter = help.createReporter.call(this);

        help.callValidator('gardr', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 5);
            done();
        });

    });

    function getValid(clickHandler, noWindowOpen) {
        var windowOpened = (noWindowOpen ? [] : [
             {
              'target': typeof noWindowOpen === 'string' ? noWindowOpen : 'new_window',
              'time': 1410339022195,
              'trace': {
                'function': 'onclick',
                'line': 19,
                'sourceURL': 'http://...'
              },
              'url': 'http://...'
            }
        ]);
        return {
            'gardr': {
                'data': {
                    'frameInput': {
                        'height': 225,
                        'minSize': 39,
                        'name': 'phantom',
                        'timeout': 200,
                        'url': '...',
                        'width': 980
                    },
                    'rendered': {
                        'height': 225,
                        'width': 980
                    }
                },
                'dom': {
                    banner: {
                        name: 'DIV',
                        clickHandler: clickHandler,
                        found: true,
                        css: {
                            position: 'static',
                            height: '225px',
                            display: 'block',
                            width: '980px'
                        }
                    },
                    wrapper: {
                        css: {
                            position: 'static',
                            display: 'block',
                            visability: ''
                        }
                    }
                }
            },
            actions: {
                navigations: [],
                illegalNavigations: [],
                windowOpened: windowOpened
            }
        };
    }

    it('should validate size based on options', function (done) {

        var harvest = getValid('function(){window.open(url, "new_window");}');
        var reporter = help.createReporter.call(this);

        function mutate(context, options){
            options.width.min = 400;
            options.width.max = 400;
        }

        function handler() {
            var result = reporter.getResult();
            assert.equals(result.error.length, 1, '400 is height format, other heights should generate error');
            done();
        }

        help.callValidator('gardr', harvest, reporter, handler, mutate);

    });

    it('should error on missing clickhandler', function (done) {

        var harvest = getValid(null, true);

        var reporter = help.createReporter.call(this);

        help.callValidator('gardr', harvest, reporter, function () {
            var result = reporter.getResult();

            assert.equals(result.error.length, 2);
            done();
        });

    });

    it('should pass on valid clickhandler', function (done) {

        var harvest = getValid('function(){window.open(url, "new_window");}');

        var reporter = help.createReporter.call(this);

        help.callValidator('gardr', harvest, reporter, function () {
            var result = reporter.getResult();

            assert.equals(result.error.length, 0);
        });

        harvest = getValid('window.open(url, "new_window")');

        help.callValidator('gardr', harvest, reporter, function () {
            var result = reporter.getResult();

            assert.equals(result.error.length, 0);
            done();
        });

    });

    it('should error on invalid ref', function (done) {
        var harvest = getValid('function(){open(url, "_blank");}', '_blank');
        var reporter = help.createReporter.call(this);

        help.callValidator('gardr', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 2);
            done();
        });

    });

    it('should error on invalid window target', function (done) {

        var harvest = getValid('window.open(url, "_blank")', '_blank');

        var reporter = help.createReporter.call(this);

        help.callValidator('gardr', harvest, reporter, function () {
            var result = reporter.getResult();
            assert.equals(result.error.length, 2);
            done();
        });
    });

    it('should call next if missing data', function (done) {
        help.callValidator('gardr', {}, {}, done);
    });

});
