module.exports = {
    validate: function (harvested, report, next) {
        if (harvested.systemErrors && harvested.systemErrors.length > 0){
            harvested.systemErrors.forEach(function(errorEntry){
                // ..
                report.error(errorEntry.message, errorEntry);
            });
        }

        if (harvested.errors && harvested.errors.length > 0){
            harvested.errors.forEach(function(errorEntry){
                // ..
                report.error(errorEntry.message, errorEntry);
            });
        }
        next();
    }
};
