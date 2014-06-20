module.exports = {
    dependencies: ['har'],
    preprocessors: ['security'],
    validate: function validate(harvested, report, next, globalOptions, options) {

        if (!options.checkUrl || !harvested.security || !harvested.security.domainResult) {
            if (!harvested.security) {
                console.log('Security validator: Missing security property:', harvested.security);
            }
            return next();
        }

        function filterMalware(key) {
            return harvested.security.domainResult[key] && harvested.security.domainResult[
                key] === 'malware';
        }


        if (harvested.security && harvested.security.domainResult) {

            var len = Object.keys(harvested.security.domainResult).filter(filterMalware);

            if (len && len.length > 0) {
                report.error(
                    'Domains may contain malware according to Google Safe Browsing API', {
                        list: len
                    });
            }
        }

        next();

    }
};
