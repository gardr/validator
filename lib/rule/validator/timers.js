const MAX_CALLS = 3;
const METHODS = ['setTimeout', 'setInterval'];
module.exports = {
    validate: function (harvested, report, next) {
        METHODS.forEach(function (method) {
            if (harvested && harvested[method] && harvested[method].length >= MAX_CALLS) {
                report({
                    level: 'error',
                    message: 'Overusage of ' + method + '. Used ' + harvested[method].length + ' times when maximum is '+ (MAX_CALLS),
                });
            }
        });

        next();
    }
};
