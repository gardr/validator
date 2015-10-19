module.exports = {
    dependencies: ['common'],
    validate: function (harvested, report, next, globalConfig) {
        'use strict';

        report.setChecklist('Errors', 'Code throwing errors');


        if (harvested.common.systemErrors && harvested.common.systemErrors.length > 0){
            harvested.common.systemErrors.forEach(function(errorEntry){
                report.error(errorEntry.message, errorEntry);
            });
        }

        if (harvested.common.errors && harvested.common.errors.length > 0){
            harvested.common.errors.forEach(function(errorEntry){
                report.error(errorEntry.message, errorEntry);
            });
        }

        report.exitChecklist();

        var config = globalConfig.config;
        if (config.adops && config.adops.flatZIP === true) {

            report.setChecklist('Zip', 'packaged files');

            if (harvested.common.zip && Array.isArray(harvested.common.zip.ziplog)) {
                var result = harvested.common.zip.ziplog.filter(function(entry) {
                    if (entry.folder && entry.folder !== '.DS_Store') {
                        return true;
                    }
                });

                if (result.length > 0) {
                    report.error('Zip should be flat and not include folders', {list: result.map(function(e){
                        return e.folder;
                    })});
                } else {
                    report.info('Zip did not include folders');
                }
            }
            report.exitChecklist();
        }


        next();
    }
};
