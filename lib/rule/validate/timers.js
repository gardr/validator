var internals = {};

internals.isExternal = function (base, entry) {
    return (
        entry &&
        entry.trace &&
        entry.trace.sourceURL &&
        entry.trace.sourceURL.indexOf('http') === 0 &&
        // entry.trace.sourceURL.indexOf('phantomjs://') !== 0 &&
        entry.trace.sourceURL.indexOf(base) !== 0

    );
};

internals.validate = function (harvested, report, next, globalOptions) {

    var base = globalOptions.resourceDomainBase;

    report.setChecklist('Timers', 'Check for usage of timers to prevent overusage that might create performance issues');

    var METHODS     = ['setTimeout', 'setInterval', 'requestAnimationFrame'];
    var MAX_CALLS   = [
        this.setTimeout||20,
        this.setInterval||1,
        this.requestAnimationFrame||0
    ];

    if (!(harvested.timers)) {
        report.debug('No timers present.');
        return next();
    }

    METHODS.forEach(function (method, methodIndex) {
        // filter out internal
        var max = MAX_CALLS[methodIndex];
        var list = harvested.timers[method];
        if (!list || list.length === 0) {
            return;
        }

        // handle lists in lists
        var listsInLists = Array.isArray(list[0]);

        if (listsInLists) {
            list.forEach(collectionInCollection);
        } else {
            collectionInCollection(list, 0, list);
        }

        function collectionInCollection(collection /*, index, list*/) {
            collection = collection.filter(internals.isExternal.bind(null, base));
            var msg;
            var trace = {trace: collection.map(function(v){
                return v.trace;
            })};

            if (collection.length > max) {
                msg = ['Overusage of ', method, '.', ' In practice ', collection.length, ' times when maximum is ', (max)].join('');
                report.error(msg, trace);
            } else if (collection.length > (max > 1 ? max / 2 : 0) && collection.length <= max) {
                msg = ['Usage of ', method, '.', ' ', collection.length, ' times used when maximum is ', (max)].join('');
                report.warn(msg, trace);
            }
        }
    });
    report.exitChecklist();
    next();
};

module.exports = {
    dependencies: ['timers'],
    validate: internals.validate
};
