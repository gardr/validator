module.exports = {
    dependencies: ['cookies'],
    preprocessors: [],
    validate: function validate(harvested, report, next/*, globalOptions*/) {

        report.setChecklist('Browser cookies', 'adds overhead to performance');

        var cookies = harvested.cookies.cookies;

        if (cookies && cookies.length > 0) {
            report.info('Detected ' + cookies.length + ' cookie being set after run', {code: cookies});
        }

        report.exitChecklist();

        next();
    }
};
