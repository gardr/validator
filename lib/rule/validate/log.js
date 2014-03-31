module.exports = {
    dependencies: ['log'],
    preprocessors: ['log'],
    validate: function validate(harvested, report, next/*, globalOptions*/) {
        next();
    }
};
