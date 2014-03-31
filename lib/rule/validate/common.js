module.exports = {
    dependencies: ['common'],
    validate: function (harvested, report, next) {
        'use strict';
        if (harvested.common.systemErrors && harvested.common.systemErrors.length > 0){
            harvested.common.systemErrors.forEach(function(errorEntry){
                report.error(errorEntry.message, errorEntry);
            });
        }

        if (harvested.common.errors && harvested.common.errors.length > 0){
            harvested.common.errors.forEach(function(errorEntry){
                report.error(errorEntry.message, errorEntry);
            });
        }
        next();
    }
};
