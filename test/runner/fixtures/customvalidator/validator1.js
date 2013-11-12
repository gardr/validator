module.exports = {
    validate: function(harvested, report, next){
        report.info('some info here');

        setTimeout(function(){
            report.debug('debugging', {});

            next();
        }, 10);

    }
};
