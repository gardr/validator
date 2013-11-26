var async = require('async');
var path = require('path');

var KEYS = ['info','debug', 'warn', 'error'];

function createReportHelper(result){
    return function entryReporter(validatorFileName){
        var reportHelpers = {};

        KEYS.forEach(function(key){
            result[key] = result[key]||[];
            reportHelpers[key] = function(message, data){
                var res = {
                    'message': message,
                    'validatorFileName': validatorFileName,
                    'validatorName': path.basename(validatorFileName, '.js')
                };
                if (data){
                    res.data = data;
                    if (res.data.trace && !Array.isArray(res.data.trace)){
                        res.data.trace = [res.data.trace];
                    }

                    if (Array.isArray(res.data.trace)){
                        res.data.trace.forEach(function(entry){
                            entry.file = path.basename(entry.sourceURL).replace(/\?.*$/, '');
                        });
                    }
                }
                result[key].push(res);
            };
            reportHelpers.getResult = function(){
                return result;
            };
        });
        return reportHelpers;
    };
}

function validate(harvestedData, options, done){
    var resultData = {};
    var validators = options.validatorFiles;
    var entryReporter = createReportHelper(resultData);

    if (!Array.isArray(validators)){
        throw new Error('validators should be an list');
    }

    async.map(validators, function(fileName, done){

        var mod = require(fileName);

        if (!mod || !mod.validate){
            return done();
        }

        mod.validate(harvestedData, entryReporter(fileName), done, options);

    }, function(err){
        done(err, harvestedData, resultData, options);
    });
}


module.exports = {
    validate: validate,
    createReportHelper: createReportHelper
};
