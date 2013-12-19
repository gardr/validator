var moment = require('moment');

module.exports = {
    dependencies: ['log'],
    validate: function validate(harvested, report, next) {
        next();
    }
};
