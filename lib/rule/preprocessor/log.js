var moment = require('moment');

module.exports = {
    dependencies: ['log'],
    validate: function validate(harvested, report, next) {

        if (harvested.log.logs){
            harvested.log.logs.forEach(function (entry) {
                entry.formattedTime = moment(entry.time).format('HH:mm:ss,SSS');
            });
        }
        next();
    }
};
