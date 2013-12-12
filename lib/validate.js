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
                        var found = [];
                        res.data.trace = res.data.trace.filter(function(entry){
                            var key = entry.file+entry.sourceURL+entry.line;
                            if (found.indexOf(key)>-1) {
                                return false;
                            }

                            entry.file = path.basename(entry.sourceURL).replace(/\?.*$/, '');
                            if (entry.file.length > 25){
                                entry.file = entry.file.substring(0, 25);
                            }
                            found.push(key);

                            return true;

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

function validate(harvested, options, callback){
    var resultData = {};
    var validators = options.validatorFiles;
    var entryReporter = createReportHelper(resultData);

    if (!Array.isArray(validators)){
        throw new Error('Validators should be an list');
    }

    async.mapSeries(validators, function next(fileName, done){

        var mod = require(fileName);

        if (!mod || !mod.validate){
            return done();
        }

        mod.validate(harvested, entryReporter(fileName), done, options);

    }, function validationDone(err){
        callback(err, harvested, resultData, options);
    });
}


module.exports = {
    validate: validate,
    createReportHelper: createReportHelper
};
