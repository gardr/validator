// move stuff from gardr.js
var internals = {};


// illegalNavigations
internals.validateIllegalNavigations = function(navs, report) {
    if (!Array.isArray(navs) || navs.length === 0) {
        return;
    }

    report.error('Found illegal navigations not triggered by user action.', {list: navs.map(function(navEntry){
        return new Date(navEntry.timestamp) + ': ' + navEntry.type + ' ' + navEntry.url;
    })});
};

internals.validateNavigations = function(navs, report) {
    if (!Array.isArray(navs) || navs.length === 0) {
        return;
    }

    report.info('Found navigations triggered by user action.', {list: navs.map(function(navEntry){
        return new Date(navEntry.timestamp) + ': ' + navEntry.type + ' ' + navEntry.url;
    })});
};

module.exports = {
    dependencies: ['actions'],
    validate: function(harvested, report, next) {
        if (harvested && harvested.actions) {

            report.setChecklist('Navigations', 'Check for navigations');

            internals.validateIllegalNavigations.call(this, harvested.actions.illegalNavigations , report);
            internals.validateNavigations.call(this, harvested.actions.navigations , report);

            if (harvested.actions.navigations.length === 0 &&
                harvested.actions.windowOpened.length === 0) {
                    report.warn('Banner did not navigate after user action.');
            }

            next();

        } else {
            next();
        }
    }
};
