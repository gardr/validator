/*
  rule

    - validates


*/
function TimersRule() {

}

TimersRule.prototype = Rule;

var wrap = require('../wrap'); // return list[file:line]

var timers = {
    name: 'timers',
    //onRequestEnd: function () {},
    event: 'probe:pre',
    // phantom context
    init: function (page, report, args) {
        // window.setTimout(function () {
        //     timers.done = true;
        //     report.input.probes = page.evaluate(function(){return __probes;});
        // }, 10000);
    },
    // e.g. click?
    action: {

    },
    // page iframe context
    probe: function(){
        function count() {

        }
        wrap('setTimeout',         '__probes');
        wrap('setInterval',        '__probes');
        wrap('clearInterval',      '__probes');
    },
    reporterDependencies: ['input', 'har'],
    reporter: function (inputList, har, done) {

    }
};



module.exports = timers;
/*

  Total:

  url: ...,
  baseConfig: {
    maxTimeout: 20000
  },
  rules: {
      timers: 10,
      jQueryVersion: "[12].10.3"
  }

  Object.keys(rules).map(function(name) {
    return {name: name, }
  })

*/
