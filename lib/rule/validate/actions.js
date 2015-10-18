// move stuff from gardr.js
var internals = {};


// illegalNavigations
internals.valdiateIllegalNavigations = function(navs, report) {
    if (!Array.isArray(navs) || navs.length === 0) {
        return;
    }

    report.error('Found illegal navigations not triggered by user action.', {list: navs.map(function(navEntry){
        return new Date(navEntry.timestamp) + ': ' + navEntry.type + ' ' + navEntry.url;
    })});
};

internals.valdiateNavigations = function(navs, report) {
    if (!Array.isArray(navs) || navs.length === 0) {
        report.warn('Banner did not navigate after user action.')
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

            internals.valdiateIllegalNavigations.call(this, harvested.actions.illegalNavigations , report);
            internals.valdiateNavigations.call(this, harvested.actions.navigations , report);
            
            next();

        } else {
            next();
        }
    }
};
