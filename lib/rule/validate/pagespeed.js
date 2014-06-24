module.exports = {
    dependencies: [],
    preprocessors: ['pagespeed'],
    validate: function validate(harvested, report, next/*, globalOptions*/) {
        if (this && !this.runGooglePagespeed){
            return next();
        }

        if (harvested.pagespeed && harvested.pagespeed.result){
            report.setChecklist('Google Pagespeed');
            var result = harvested.pagespeed.result;

            if (result.score <= this.scoreThreshold){
                report.error('Pagesspeed score is to low. Score is '+result.score+' but should be above '+this.scoreThreshold);
            } else {
                report.info('Pagespeed score (\"'+result.score+'\") is approved.');
            }
            report.exitChecklist();
        }

        next();
    }
};
