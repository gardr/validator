var internals = {};

internals.isHttp = function (entry) {
    return (entry && entry.trace && entry.trace.sourceURL && entry.trace.sourceURL.indexOf('http') === 0);
};

internals.validate = function (harvested, report, next) {

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
            collection = collection.filter(internals.isHttp);
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
    next();
};

module.exports = {
    dependencies: ['timers'],
    validate: internals.validate
};
