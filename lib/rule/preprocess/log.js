var moment = require('moment');

module.exports = {
    dependencies: ['log'],
    preprocess: function (harvested, report, next) {
        if (harvested.log){
            var userLogs = [];
            var logs = [];
            harvested.log.logs.forEach(function (entry) {
                entry.formattedTime = moment(entry.time).format('HH:mm:ss,SSS');

                if (!entry.message || entry.message.indexOf('!internal') !== 0) {
                    userLogs.push(entry);
                } else {
                    logs.push(entry);
                }
            });
            harvested.log.logs = logs;
            harvested.log.userLogs = userLogs;

        }
        next();
    }
};
