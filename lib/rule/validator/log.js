var moment = require('moment');


function validate(probed, report, next) {

    probed.logs.forEach(function(entry){
        entry.formattedTime = moment(entry.time).format('HH:mm:ss,SSS');
    });

    next();
}

module.exports = {
    validate: validate
};
