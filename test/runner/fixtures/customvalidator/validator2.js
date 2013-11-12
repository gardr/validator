module.exports = {
    validate: function(harvested, report, next){
        report.error('Some error');
        report.warn('some warning');
        next();
    }
};
