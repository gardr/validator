module.exports = {
    'dependencies': ['hooky2'],
    validate: function(harvested, report, next){
        report.error('Some error');
        report.warn('some warning');
        if (harvested.hooky){
            report.error('Should not have hooky');
        }
        if (!harvested.hooky2){
            report.error('Should have hooky2');
        }
        next();
    }
};
