module.exports = {
    dependencies: ['har'],
    preprocessors: ['security'],
    validate: function validate(harvested, report, next, globalOptions, options) {



        if (!options.checkUrl || !harvested.security || !harvested.security.domainsResult) {
            if (!harvested.security) {
                console.log('Security validator: Missing security property:', harvested.security);
            }
            return next();
        }

        report.setChecklist('Security', 'Check for domains that are known to serve malware');

        function filterMalware(key) {
            return harvested.security.domainsResult[key] && harvested.security.domainsResult[
                key] === 'malware';
        }


        if (harvested.security && harvested.security.domainsResult) {

            var len = Object.keys(harvested.security.domainsResult).filter(filterMalware);

            if (len && len.length > 0) {
                report.error(
                    'Domains may contain malware according to Google Safe Browsing API', {
                        list: len
                    });
            } else {
                report.success('Domains are not flagged for malware', {list: harvested.security.domains});
            }
        }

        report.exitChecklist();

        next();

    }
};
