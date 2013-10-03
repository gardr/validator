
var chai = require('chai');
var expect = chai.expect;

describe('validation runner', function(){

	describe('generic runner module expectations', function(){

    it('should exsit a runner module object', function(){
      var runner = resolveRunnerModule();
      expect(runner).to.not.be.undefined;
      expect(runner).to.be.a('object');
    });

	});

  describe('runner api', function(){
    var runner;

    beforeEach(function(){
      runner = resolveRunnerModule();
    });

    it('should provide a run function which takes an URL parameter', function(){
      expect(runner.run).to.not.be.undefined;
      expect(runner.run.toString()).to.be.contain('url');
    });

    it('shoul return a result object structure', function(){
      var result = runner.run('/fooBar');
      expect(result).to.not.be.undefined;
      expect(result).to.be.a('object');
    });

  });
  function resolveRunnerModule(){
    return require('../src/runner');
  }

});

