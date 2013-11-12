module.exports = {
    validate: function (harvested, report, next) {
        if (harvested.systemErrors > 0){
            report.error({});
        }
        next();
    }
};
