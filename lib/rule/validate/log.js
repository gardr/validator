module.exports = {
    dependencies: ['log'],
    preprocessors: ['log'],
    validate: function validate(harvested, report, next/*, globalOptions*/) {

        if (this.errorOnConsole === true) {
            if (harvested && harvested.log.userLogs && harvested.log.userLogs.length > 0) {
                harvested.log.userLogs.forEach(function(line) {
                    report.error('Should not output log message', {trace: line});
                });
            }
        }
        next();
    }
};
